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

type PersonMask =
  | {
      data: Float32Array;
      type: "confidence";
    }
  | {
      data: Uint8Array;
      type: "category";
      personCategory: number;
    }
  | {
      data: Uint8Array;
      type: "category-binary";
      personCategory: number;
      inverted: boolean;
    };

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

function getCenterScore(
  data: Float32Array | Uint8Array,
  width: number,
  height: number,
  getValue: (value: number) => number
) {
  let centerTotal = 0;
  let centerCount = 0;
  let cornerTotal = 0;
  let cornerCount = 0;

  const centerLeft = Math.floor(width * 0.3);
  const centerRight = Math.ceil(width * 0.7);
  const centerTop = Math.floor(height * 0.18);
  const centerBottom = Math.ceil(height * 0.82);
  const cornerWidth = Math.max(1, Math.floor(width * 0.18));
  const cornerHeight = Math.max(1, Math.floor(height * 0.18));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = getValue(data[y * width + x]);

      if (x >= centerLeft && x < centerRight && y >= centerTop && y < centerBottom) {
        centerTotal += value;
        centerCount += 1;
      }

      const inCornerX = x < cornerWidth || x >= width - cornerWidth;
      const inCornerY = y < cornerHeight || y >= height - cornerHeight;
      if (inCornerX && inCornerY) {
        cornerTotal += value;
        cornerCount += 1;
      }
    }
  }

  const centerAverage = centerCount > 0 ? centerTotal / centerCount : 0;
  const cornerAverage = cornerCount > 0 ? cornerTotal / cornerCount : 0;
  return centerAverage - cornerAverage * 0.75;
}

function getPersonMask(result: ReturnType<ImageSegmenter["segment"]>): PersonMask {
  const confidenceMasks = result.confidenceMasks;
  if (confidenceMasks && confidenceMasks.length > 0) {
    let bestData = confidenceMasks[0].getAsFloat32Array();
    let bestScore = getCenterScore(bestData, confidenceMasks[0].width, confidenceMasks[0].height, (value) => value);

    for (let index = 1; index < confidenceMasks.length; index += 1) {
      const mask = confidenceMasks[index];
      const data = mask.getAsFloat32Array();
      const score = getCenterScore(data, mask.width, mask.height, (value) => value);

      if (score > bestScore) {
        bestData = data;
        bestScore = score;
      }
    }

    return {
      data: bestData,
      type: "confidence" as const,
    };
  }

  const categoryMask = result.categoryMask;
  if (!categoryMask) {
    throw new Error("The browser did not return a person mask.");
  }

  const data = categoryMask.getAsUint8Array();
  const counts = new Map<number, number>();
  for (const value of data) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const categories = Array.from(counts.keys());
  let bestCategory = categories[0] ?? 1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const category of categories) {
    const score = getCenterScore(data, categoryMask.width, categoryMask.height, (value) =>
      value === category ? 1 : 0
    );

    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  if (categories.length <= 2) {
    const directScore = getCenterScore(data, categoryMask.width, categoryMask.height, (value) =>
      value === bestCategory ? 1 : 0
    );
    const invertedScore = getCenterScore(data, categoryMask.width, categoryMask.height, (value) =>
      value === bestCategory ? 0 : 1
    );

    return {
      data,
      type: "category-binary" as const,
      personCategory: bestCategory,
      inverted: invertedScore > directScore,
    };
  }

  return {
    data,
    type: "category" as const,
    personCategory: bestCategory,
  };
}

function getPersonAlpha(mask: ReturnType<typeof getPersonMask>, pixelIndex: number) {
  if (mask.type === "confidence") {
    return Math.max(0, Math.min(255, Math.round(mask.data[pixelIndex] * 255)));
  }

  const isCategory = mask.data[pixelIndex] === mask.personCategory;
  const isPerson = mask.type === "category-binary" && mask.inverted ? !isCategory : isCategory;
  return isPerson ? 255 : 0;
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
