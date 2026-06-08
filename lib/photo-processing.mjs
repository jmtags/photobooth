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

  return [
    "Edit this into a print-ready ID photo.",
    "Edit only the masked area.",
    "Keep the original head completely unchanged.",
    "Preserve the same identity, face shape, facial features, hair, hairline, ears, eyebrows, eyes, nose, lips, jawline, skin texture, expression, gaze, and head position.",
    "Do not beautify, reshape, smooth, de-age, restyle, relight, or reinterpret anything related to the head or face.",
    "Do not change the hairstyle, hair color, or any facial expression.",
    "If clothing or background edits are requested, make those edits only outside the head area.",
    "Keep the exact original framing and person proportions.",
    background,
    attire,
    "Do not add text, logos, filters, accessories, or decorative elements.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function getEditSize(photoUrl, model) {
  const metadata = await sharp(dataUrlToBuffer(photoUrl)).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  if (!originalWidth || !originalHeight) {
    return "1024x1536";
  }

  if (model !== "gpt-image-2") {
    return originalWidth >= originalHeight ? "1536x1024" : "1024x1536";
  }

  let width = Math.max(16, Math.round(originalWidth / 16) * 16);
  let height = Math.max(16, Math.round(originalHeight / 16) * 16);
  const maxEdge = 3840;
  const minPixels = 655360;
  const maxPixels = 8294400;

  const fitScale = Math.min(maxEdge / width, maxEdge / height, 1);
  width = Math.max(16, Math.floor((width * fitScale) / 16) * 16);
  height = Math.max(16, Math.floor((height * fitScale) / 16) * 16);

  const ratio = Math.max(width / height, height / width);
  if (ratio > 3) {
    if (width > height) {
      width = height * 3;
    } else {
      height = width * 3;
    }
    width = Math.max(16, Math.floor(width / 16) * 16);
    height = Math.max(16, Math.floor(height / 16) * 16);
  }

  const pixels = width * height;
  if (pixels < minPixels) {
    const upscale = Math.sqrt(minPixels / pixels);
    width = Math.max(16, Math.ceil((width * upscale) / 16) * 16);
    height = Math.max(16, Math.ceil((height * upscale) / 16) * 16);
  }

  if (width * height > maxPixels) {
    const downscale = Math.sqrt(maxPixels / (width * height));
    width = Math.max(16, Math.floor((width * downscale) / 16) * 16);
    height = Math.max(16, Math.floor((height * downscale) / 16) * 16);
  }

  return `${width}x${height}`;
}

async function createHeadProtectionMask(photoUrl) {
  const originalBuffer = dataUrlToBuffer(photoUrl);
  const originalMeta = await sharp(originalBuffer).metadata();

  if (!originalMeta.width || !originalMeta.height) {
    throw new Error("Original photo dimensions are unavailable.");
  }

  const width = originalMeta.width;
  const height = originalMeta.height;
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      const insideHead =
        ((nx - 0.5) / 0.205) ** 2 + ((ny - 0.275) / 0.255) ** 2 <= 1 ||
        ((nx - 0.5) / 0.09) ** 2 + ((ny - 0.515) / 0.06) ** 2 <= 1 ||
        ((nx - 0.5) / 0.13) ** 2 + ((ny - 0.575) / 0.035) ** 2 <= 1;
      const idx = (y * width + x) * 4;
      const alpha = insideHead ? 0 : 255;

      rgba[idx] = 255;
      rgba[idx + 1] = 255;
      rgba[idx + 2] = 255;
      rgba[idx + 3] = alpha;
    }
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function restoreOriginalHead({ originalPhotoUrl, editedPhotoDataUrl }) {
  const originalBuffer = dataUrlToBuffer(originalPhotoUrl);
  const editedBuffer = dataUrlToBuffer(editedPhotoDataUrl);
  const originalMeta = await sharp(originalBuffer).metadata();

  if (!originalMeta.width || !originalMeta.height) {
    throw new Error("Original photo dimensions are unavailable.");
  }

  const width = originalMeta.width;
  const height = originalMeta.height;
  const headMaskSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="transparent"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.285}" rx="${width * 0.205}" ry="${height * 0.245}" fill="white"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.515}" rx="${width * 0.09}" ry="${height * 0.06}" fill="white"/>
    </svg>
  `;

  const softHeadMask = await sharp(Buffer.from(headMaskSvg))
    .resize(width, height)
    .blur(4)
    .png()
    .toBuffer();

  const originalHead = await sharp(originalBuffer)
    .resize(width, height)
    .ensureAlpha()
    .composite([{ input: softHeadMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const restored = await sharp(editedBuffer)
    .resize(width, height)
    .ensureAlpha()
    .composite([{ input: originalHead, blend: "over" }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${restored.toString("base64")}`;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function buildModelSequence(primaryModel, options) {
  const models = [primaryModel];

  if (primaryModel === "gpt-image-2" && options?.background !== "removed") {
    models.push("gpt-image-1.5");
  }

  return models;
}

function createImageEditForm({ model, imageBlob, headProtectionMask, prompt, size, background }) {
  const form = new FormData();
  form.append("model", model);
  form.append("image", imageBlob, "photo.png");
  form.append("mask", new Blob([headProtectionMask], { type: "image/png" }), "head-protection-mask.png");
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", model === "gpt-image-2" ? "high" : "medium");
  form.append("output_format", "png");

  if (background === "removed") {
    form.append("background", "transparent");
  }

  return form;
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

  const effectiveOptions = options ?? {};
  const needsBackgroundEdit = effectiveOptions.background && effectiveOptions.background !== "original";
  const needsAttireEdit = effectiveOptions.attire && effectiveOptions.attire !== "original";

  if (!needsBackgroundEdit && !needsAttireEdit) {
    return photoUrl;
  }

  const imageBlob = dataUrlToBlob(photoUrl);
  const headProtectionMask = await createHeadProtectionMask(photoUrl);
  const primaryModel = getImageModel(effectiveOptions);
  const modelSequence = buildModelSequence(primaryModel, effectiveOptions);
  const prompt = buildPrompt(effectiveOptions);
  let lastError = null;

  for (const model of modelSequence) {
    const size = await getEditSize(photoUrl, model);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const form = createImageEditForm({
        model,
        imageBlob,
        headProtectionMask,
        prompt,
        size,
        background: effectiveOptions.background,
      });

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      const result = await readOpenAIResponse(response);

      if (response.ok) {
        const b64 = result?.data?.[0]?.b64_json;
        if (!b64) {
          throw new Error("OpenAI did not return an edited image.");
        }

        return restoreOriginalHead({
          originalPhotoUrl: photoUrl,
          editedPhotoDataUrl: `data:image/png;base64,${b64}`,
        });
      }

      const message =
        result?.error?.message ??
        result?.message ??
        result?.raw?.slice(0, 300) ??
        "OpenAI image editing failed.";
      const requestId = response.headers.get("x-request-id");

      lastError = new PhotoProcessingError(`OpenAI image edit failed (${response.status}): ${message}`, 502, {
        openaiModel: model,
        openaiAttempt: attempt + 1,
        openaiStatus: response.status,
        openaiRequestId: requestId,
        openaiErrorType: result?.error?.type,
        openaiErrorCode: result?.error?.code,
      });

      if (!shouldRetryStatus(response.status) || attempt === 2) {
        break;
      }

      await sleep(800 * (attempt + 1));
    }
  }

  throw lastError ?? new Error("OpenAI image editing failed.");
}
