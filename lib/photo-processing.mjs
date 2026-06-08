import sharp from "sharp";

export function dataUrlToBlob(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid photo data.");
  }

  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mimeType });
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid photo data.");
  }

  return Buffer.from(match[2], "base64");
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
    "Change the background and clothing exactly as requested.",
    "Keep the exact original framing, perspective, and head size from the input photo.",
    "Do not change any part of the head, face, hair, hairline, ears, neck, expression, or face shape.",
    "Preserve the original face, hair, eyebrows, eyes, nose, lips, jawline, skin texture, gaze, expression, and head shape exactly as captured.",
    "Do not beautify, reshape, slim, smooth, de-age, restyle, relight, or reinterpret the face or head.",
    "Do not change the hairstyle, hair color, or any facial expression.",
    "It is okay to fully replace the clothing and the background outside the protected head area.",
    background,
    attire,
    retouching,
    "Do not add text, logos, filters, accessories, or decorative elements.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function createHeadProtectionMask(photoUrl) {
  const originalBuffer = dataUrlToBuffer(photoUrl);
  const originalMeta = await sharp(originalBuffer).metadata();

  if (!originalMeta.width || !originalMeta.height) {
    throw new Error("Original photo dimensions are unavailable.");
  }

  const width = originalMeta.width;
  const height = originalMeta.height;
  const maskSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="transparent"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.275}" rx="${width * 0.205}" ry="${height * 0.255}" fill="white"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.515}" rx="${width * 0.09}" ry="${height * 0.06}" fill="white"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.575}" rx="${width * 0.13}" ry="${height * 0.035}" fill="white"/>
    </svg>
  `;

  return sharp(Buffer.from(maskSvg))
    .resize(width, height)
    .blur(1)
    .png()
    .toBuffer();
}

function getImageModel(options) {
  const raw = process.env.OPENAI_IMAGE_MODEL?.trim();
  const model = raw?.startsWith("OPENAI_IMAGE_MODEL=")
    ? raw.slice("OPENAI_IMAGE_MODEL=".length).trim()
    : raw || "gpt-image-2";

  const allowed = new Set(["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"]);
  if (!allowed.has(model)) {
    throw new Error(
      `Invalid OPENAI_IMAGE_MODEL "${raw}". Use one of: gpt-image-2, gpt-image-1.5, gpt-image-1, gpt-image-1-mini.`
    );
  }

  if (options?.background === "removed" && model === "gpt-image-2") {
    return "gpt-image-1.5";
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
  const headProtectionMask = await createHeadProtectionMask(photoUrl);
  const imageModel = getImageModel(options ?? {});
  const form = new FormData();
  form.append("model", imageModel);
  form.append("image", imageBlob, "photo.png");
  form.append("mask", new Blob([headProtectionMask], { type: "image/png" }), "head-protection-mask.png");
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
