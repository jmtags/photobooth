export function dataUrlToBlob(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid photo data.");
  }

  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mimeType });
}

export function buildPrompt(options) {
  const background = {
    original: "Keep the original background.",
    white: "Replace the background with a clean, plain white studio background.",
    blue: "Replace the background with a clean, plain royal blue ID-photo background.",
    removed: "Remove the background and return a transparent PNG around the person.",
  }[options.background ?? "original"];

  const attire = {
    original: "Keep the person's original clothing.",
    "male-office":
      "Replace only the clothing with realistic male office attire: dark blazer, light collared shirt, neat professional styling.",
    "female-office":
      "Replace only the clothing with realistic female office attire: professional blazer, modest blouse, neat professional styling.",
  }[options.attire ?? "original"];

  const retouching = [
    options.brightness ? "Balance exposure and make the portrait evenly lit." : "",
    options.smoothing ? "Apply subtle natural skin smoothing without changing facial features." : "",
    options.skinTone ? "Keep skin tone natural and realistic." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "Edit this into a print-ready ID photo.",
    "Preserve the same identity, face shape, facial features, hair, expression, and head position.",
    "Use a centered head-and-shoulders passport-photo composition with natural lighting.",
    background,
    attire,
    retouching,
    "Do not add text, logos, filters, accessories, or decorative elements.",
  ]
    .filter(Boolean)
    .join(" ");
}

function getImageModel() {
  const raw = process.env.OPENAI_IMAGE_MODEL?.trim();
  const model = raw?.startsWith("OPENAI_IMAGE_MODEL=")
    ? raw.slice("OPENAI_IMAGE_MODEL=".length).trim()
    : raw || "gpt-image-1";

  const allowed = new Set(["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"]);
  if (!allowed.has(model)) {
    throw new Error(
      `Invalid OPENAI_IMAGE_MODEL "${raw}". Use one of: gpt-image-1.5, gpt-image-1, gpt-image-1-mini.`
    );
  }

  return model;
}

export class PhotoProcessingError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "PhotoProcessingError";
    this.status = status;
    this.details = details;
  }
}

async function readOpenAIResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function processPhoto({ photoUrl, options }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the API server.");
  }

  if (!photoUrl || typeof photoUrl !== "string") {
    throw new Error("A captured photo is required.");
  }

  const imageBlob = dataUrlToBlob(photoUrl);
  const form = new FormData();
  form.append("model", getImageModel());
  form.append("image", imageBlob, "photo.png");
  form.append("prompt", buildPrompt(options ?? {}));
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("output_format", "png");

  if (options?.background === "removed") {
    form.append("background", "transparent");
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const result = await readOpenAIResponse(response);

  if (!response.ok) {
    const message =
      result?.error?.message ??
      result?.message ??
      result?.raw?.slice(0, 300) ??
      "OpenAI image editing failed.";
    const requestId = response.headers.get("x-request-id");

    throw new PhotoProcessingError(`OpenAI image edit failed (${response.status}): ${message}`, 502, {
      openaiStatus: response.status,
      openaiRequestId: requestId,
      openaiErrorType: result?.error?.type,
      openaiErrorCode: result?.error?.code,
    });
  }

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI did not return an edited image.");
  }

  return `data:image/png;base64,${b64}`;
}
