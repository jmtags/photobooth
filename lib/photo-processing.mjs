import sharp from "sharp";

function isEnabledEnv(value) {
  return typeof value === "string" && /^(1|true|yes|on)$/i.test(value.trim());
}

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

function bufferToDataUrl(buffer, mimeType = "image/png") {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function ellipseContains(nx, ny, cx, cy, rx, ry) {
  return ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2 <= 1;
}

function getPortraitRegions(nx, ny) {
  const insideHead = ellipseContains(nx, ny, 0.5, 0.275, 0.23, 0.275) || ellipseContains(nx, ny, 0.5, 0.325, 0.2, 0.235);
  const insideNeck = ellipseContains(nx, ny, 0.5, 0.515, 0.11, 0.075);
  const insideShoulders = ellipseContains(nx, ny, 0.5, 0.68, 0.35, 0.18);
  const insideLowerTorso = ellipseContains(nx, ny, 0.5, 0.88, 0.3, 0.2);
  const insidePerson = insideHead || insideNeck || insideShoulders || insideLowerTorso;
  const insideClothing =
    ny >= 0.46 &&
    (ellipseContains(nx, ny, 0.5, 0.68, 0.31, 0.18) || ellipseContains(nx, ny, 0.5, 0.88, 0.26, 0.22));

  return {
    insidePerson,
    insideClothing,
  };
}

function getBackgroundInstruction(background) {
  return {
    original: "Keep the original background unchanged.",
    white: "Replace the background with a clean, plain white studio background.",
    blue: "Replace the background with a clean, plain royal blue ID-photo background.",
    removed: "Remove the background and return a transparent PNG around the person.",
  }[background ?? "original"];
}

function getAttireInstruction(attire) {
  return {
    original: "Keep the person's original clothing unchanged.",
    "male-office":
      "Change only the visible clothing to realistic male office attire: dark blazer, light collared shirt, neat professional styling.",
    "female-office":
      "Change only the visible clothing to realistic female office attire: professional blazer, modest blouse, neat professional styling.",
  }[attire ?? "original"];
}

function buildBackgroundPrompt(background) {
  return [
    "Edit only the masked area.",
    "Change only the background.",
    "Preserve the entire person exactly as captured, including the face, hair, neckline, clothing, body shape, hands, and pose.",
    "Do not crop, zoom, restyle, relight, retouch, or regenerate the person.",
    "Keep the exact original framing and person proportions.",
    getBackgroundInstruction(background),
    "Do not add text, logos, accessories, or decorative elements.",
  ].join(" ");
}

function buildAttirePrompt(attire) {
  return [
    "Edit only the masked area.",
    "This crop shows the person's neck, shoulders, and torso.",
    "Change only the visible clothing.",
    "Preserve the neck, skin tone, body shape, shoulders, hands, pose, and image framing exactly as captured.",
    "Do not change or regenerate any face, head, hair, ears, or expression.",
    "Do not add text, logos, accessories, props, or decorative elements.",
    getAttireInstruction(attire),
  ].join(" ");
}

export function buildPrompt(options) {
  const needsBackgroundEdit = options?.background && options.background !== "original";
  const needsAttireEdit = options?.attire && options.attire !== "original";

  if (needsBackgroundEdit && needsAttireEdit) {
    return `${buildBackgroundPrompt(options.background)} ${buildAttirePrompt(options.attire)}`;
  }

  if (needsBackgroundEdit) {
    return buildBackgroundPrompt(options.background);
  }

  if (needsAttireEdit) {
    return buildAttirePrompt(options.attire);
  }

  return "Keep the original image unchanged.";
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

async function createMask(width, height, isEditablePixel) {
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      const idx = (y * width + x) * 4;
      const alpha = isEditablePixel(nx, ny, x, y) ? 0 : 255;

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

async function getPhotoMetadata(photoUrl) {
  const originalBuffer = dataUrlToBuffer(photoUrl);
  const originalMeta = await sharp(originalBuffer).metadata();

  if (!originalMeta.width || !originalMeta.height) {
    throw new Error("Original photo dimensions are unavailable.");
  }

  return {
    buffer: originalBuffer,
    width: originalMeta.width,
    height: originalMeta.height,
  };
}

async function createBackgroundEditMask(photoUrl) {
  const { width, height } = await getPhotoMetadata(photoUrl);
  return createMask(width, height, (nx, ny) => !getPortraitRegions(nx, ny).insidePerson);
}

async function extractAttireCrop(photoUrl) {
  const { buffer, width, height } = await getPhotoMetadata(photoUrl);
  const top = Math.max(0, Math.min(height - 1, Math.floor(height * 0.4)));
  const cropHeight = Math.max(1, height - top);
  const cropBuffer = await sharp(buffer)
    .extract({ left: 0, top, width, height: cropHeight })
    .png()
    .toBuffer();

  return {
    photoUrl: bufferToDataUrl(cropBuffer),
    top,
    width,
    height: cropHeight,
    sourceHeight: height,
  };
}

async function createAttireCropMask(crop) {
  return createMask(crop.width, crop.height, (nx, _ny, _x, y) => {
    const sourceNy = (crop.top + y + 0.5) / crop.sourceHeight;
    return getPortraitRegions(nx, sourceNy).insideClothing;
  });
}

async function createAttireBlendMask(attireCrop) {
  const rgba = Buffer.alloc(attireCrop.width * attireCrop.height * 4);

  for (let y = 0; y < attireCrop.height; y += 1) {
    for (let x = 0; x < attireCrop.width; x += 1) {
      const nx = (x + 0.5) / attireCrop.width;
      const sourceNy = (attireCrop.top + y + 0.5) / attireCrop.sourceHeight;
      const idx = (y * attireCrop.width + x) * 4;
      const alpha = sourceNy >= 0.43 && getPortraitRegions(nx, sourceNy).insidePerson ? 255 : 0;

      rgba[idx] = 255;
      rgba[idx + 1] = 255;
      rgba[idx + 2] = 255;
      rgba[idx + 3] = alpha;
    }
  }

  return sharp(rgba, { raw: { width: attireCrop.width, height: attireCrop.height, channels: 4 } })
    .blur(8)
    .png()
    .toBuffer();
}

async function compositeEditedClothing({ basePhotoUrl, attireCrop, editedCropUrl }) {
  const baseBuffer = dataUrlToBuffer(basePhotoUrl);
  const editedCropBuffer = dataUrlToBuffer(editedCropUrl);
  const blendMask = await createAttireBlendMask(attireCrop);
  const { width, height } = await getPhotoMetadata(basePhotoUrl);

  const maskedEditedCrop = await sharp(editedCropBuffer)
    .ensureAlpha()
    .resize(attireCrop.width, attireCrop.height)
    .composite([
      {
        input: blendMask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const composited = await sharp(baseBuffer)
    .ensureAlpha()
    .resize(width, height)
    .composite([{ input: maskedEditedCrop, left: 0, top: attireCrop.top, blend: "over" }])
    .png()
    .toBuffer();

  return bufferToDataUrl(composited);
}

function getImageModel() {
  const raw = process.env.OPENAI_IMAGE_MODEL?.trim();
  const model = raw?.startsWith("OPENAI_IMAGE_MODEL=")
    ? raw.slice("OPENAI_IMAGE_MODEL=".length).trim()
    : raw || "gpt-image-1";

  if (model === "gpt-image-2") {
    return "gpt-image-1";
  }

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

function isSafetyRejection(error) {
  return (
    error instanceof PhotoProcessingError &&
    error.details?.openaiStatus === 400 &&
    /safety/i.test(error.message)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function shouldRetryError(error) {
  const code = error?.cause?.code ?? error?.code;
  return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT";
}

function buildModelSequence(primaryModel) {
  return [primaryModel];
}

function createImageEditForm({ model, imageBlob, editMask, prompt, size, background }) {
  const form = new FormData();
  form.append("model", model);
  form.append("image", imageBlob, "photo.png");
  form.append("mask", new Blob([editMask], { type: "image/png" }), "photo-edit-mask.png");
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", "medium");
  form.append("output_format", "png");
  if (model === "gpt-image-1") {
    form.append("input_fidelity", "high");
  }

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

async function runOpenAIEdit({ photoUrl, prompt, editMask, background }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const imageBlob = dataUrlToBlob(photoUrl);
  const primaryModel = getImageModel();
  const modelSequence = buildModelSequence(primaryModel);
  let lastError = null;

  for (const model of modelSequence) {
    const size = await getEditSize(photoUrl, model);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const form = createImageEditForm({
        model,
        imageBlob,
        editMask,
        prompt,
        size,
        background,
      });

      let response;
      let result;

      try {
        response = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: form,
        });

        result = await readOpenAIResponse(response);
      } catch (error) {
        lastError = new PhotoProcessingError(
          `OpenAI image edit request failed${error instanceof Error ? `: ${error.message}` : "."}`,
          502,
          {
            openaiModel: model,
            openaiAttempt: attempt + 1,
            openaiNetworkCode: error?.cause?.code ?? error?.code,
          }
        );

        if (!shouldRetryError(error) || attempt === 2) {
          break;
        }

        await sleep(800 * (attempt + 1));
        continue;
      }

      if (response.ok) {
        const b64 = result?.data?.[0]?.b64_json;
        if (!b64) {
          throw new Error("OpenAI did not return an edited image.");
        }

        return `data:image/png;base64,${b64}`;
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
  const allowAttireEdit = isEnabledEnv(process.env.OPENAI_ENABLE_ATTIRE_EDIT);

  if (!needsBackgroundEdit && !needsAttireEdit) {
    return { processedPhotoUrl: photoUrl, notice: null };
  }

  let workingPhotoUrl = photoUrl;

  if (needsBackgroundEdit) {
    try {
      const backgroundMask = await createBackgroundEditMask(workingPhotoUrl);
      workingPhotoUrl = await runOpenAIEdit({
        photoUrl: workingPhotoUrl,
        prompt: buildBackgroundPrompt(effectiveOptions.background),
        editMask: backgroundMask,
        background: effectiveOptions.background === "removed" ? "removed" : undefined,
      });
    } catch (error) {
      if (isSafetyRejection(error)) {
        return {
          processedPhotoUrl: photoUrl,
          notice:
            "Background change was blocked by the safety system, so we kept your original photo unchanged.",
        };
      }
      throw error;
    }
  }

  if (!needsAttireEdit) {
    return { processedPhotoUrl: workingPhotoUrl, notice: null };
  }

  if (!allowAttireEdit) {
    return {
      processedPhotoUrl: workingPhotoUrl,
      notice: needsBackgroundEdit
        ? "Clothes change is temporarily turned off to protect face details. Background was updated, but clothes were kept original."
        : "Clothes change is temporarily turned off to protect face details. We kept the original clothes.",
    };
  }

  try {
    const attireCrop = await extractAttireCrop(workingPhotoUrl);
    const attireMask = await createAttireCropMask(attireCrop);
    const editedAttireCropUrl = await runOpenAIEdit({
      photoUrl: attireCrop.photoUrl,
      prompt: buildAttirePrompt(effectiveOptions.attire),
      editMask: attireMask,
      background: undefined,
    });

    return {
      processedPhotoUrl: await compositeEditedClothing({
        basePhotoUrl: workingPhotoUrl,
        attireCrop,
        editedCropUrl: editedAttireCropUrl,
      }),
      notice: null,
    };
  } catch (error) {
    if (isSafetyRejection(error)) {
      return {
        processedPhotoUrl: workingPhotoUrl,
        notice:
          "Clothes change was blocked by the safety system, so we kept the original clothes to protect the face.",
      };
    }
    throw error;
  }
}
