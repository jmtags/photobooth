import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import type { PhotoOptions } from "./components/PhotoOptionsScreen";

const visionWasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const selfieModelUrl =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

const backgroundColors: Record<"white" | "blue", [number, number, number]> = {
  white: [255, 255, 255],
  blue: [37, 99, 235],
};

let segmenterPromise: Promise<ImageSegmenter> | null = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = FilesetResolver.forVisionTasks(visionWasmUrl).then((vision) =>
      ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: selfieModelUrl,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      })
    );
  }

  return segmenterPromise;
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the captured photo."));
    image.src = dataUrl;
  });
}

function getPersonMask(result: ReturnType<ImageSegmenter["segment"]>) {
  const confidenceMasks = result.confidenceMasks;
  if (confidenceMasks && confidenceMasks.length > 1) {
    return {
      data: confidenceMasks[1].getAsFloat32Array(),
      type: "confidence" as const,
    };
  }

  const categoryMask = result.categoryMask;
  if (!categoryMask) {
    throw new Error("The browser did not return a person mask.");
  }

  return {
    data: categoryMask.getAsUint8Array(),
    type: "category" as const,
  };
}

function getPersonAlpha(mask: ReturnType<typeof getPersonMask>, pixelIndex: number) {
  if (mask.type === "confidence") {
    return Math.max(0, Math.min(255, Math.round(mask.data[pixelIndex] * 255)));
  }

  return mask.data[pixelIndex] === 1 ? 255 : 0;
}

export async function processPhotoLocally({
  photoUrl,
  options,
}: {
  photoUrl: string;
  options: PhotoOptions;
}) {
  if (!photoUrl) {
    throw new Error("A captured photo is required.");
  }

  if (options.background === "original") {
    return { processedPhotoUrl: photoUrl, notice: null };
  }

  if (options.background !== "white" && options.background !== "blue") {
    throw new Error("Choose a white or blue background.");
  }

  const [segmenter, image] = await Promise.all([getSegmenter(), loadImage(photoUrl)]);
  const result = segmenter.segment(image);
  const width = result.categoryMask?.width ?? result.confidenceMasks?.[0]?.width ?? image.naturalWidth;
  const height = result.categoryMask?.height ?? result.confidenceMasks?.[0]?.height ?? image.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not prepare the processed photo.");
  }

  const [backgroundRed, backgroundGreen, backgroundBlue] = backgroundColors[options.background];
  context.fillStyle = `rgb(${backgroundRed}, ${backgroundGreen}, ${backgroundBlue})`;
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const personMask = getPersonMask(result);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const alpha = getPersonAlpha(personMask, pixelIndex) / 255;
    const dataIndex = pixelIndex * 4;

    pixels[dataIndex] = Math.round(pixels[dataIndex] * alpha + backgroundRed * (1 - alpha));
    pixels[dataIndex + 1] = Math.round(pixels[dataIndex + 1] * alpha + backgroundGreen * (1 - alpha));
    pixels[dataIndex + 2] = Math.round(pixels[dataIndex + 2] * alpha + backgroundBlue * (1 - alpha));
    pixels[dataIndex + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);

  return {
    processedPhotoUrl: canvas.toDataURL("image/png"),
    notice: null,
  };
}
