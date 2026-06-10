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

function keepMainPersonComponents(binaryMask: Uint8ClampedArray, width: number, height: number) {
  const visited = new Uint8Array(binaryMask.length);
  const outputMask = new Uint8ClampedArray(binaryMask.length);
  const stack: number[] = [];
  const componentPixels: number[] = [];
  const minArea = Math.max(64, Math.floor(width * height * 0.004));
  let largestComponent: number[] = [];

  for (let startIndex = 0; startIndex < binaryMask.length; startIndex += 1) {
    if (visited[startIndex] || binaryMask[startIndex] === 0) continue;

    visited[startIndex] = 1;
    stack.push(startIndex);
    componentPixels.length = 0;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (stack.length > 0) {
      const index = stack.pop() as number;
      componentPixels.push(index);

      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const nextY = y + offsetY;
        if (nextY < 0 || nextY >= height) continue;

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;

          const nextX = x + offsetX;
          if (nextX < 0 || nextX >= width) continue;

          const nextIndex = nextY * width + nextX;
          if (visited[nextIndex] || binaryMask[nextIndex] === 0) continue;

          visited[nextIndex] = 1;
          stack.push(nextIndex);
        }
      }
    }

    if (componentPixels.length > largestComponent.length) {
      largestComponent = [...componentPixels];
    }

    const componentCenterX = (minX + maxX) / 2 / width;
    const componentCenterY = (minY + maxY) / 2 / height;
    const centered =
      componentCenterX >= 0.18 &&
      componentCenterX <= 0.82 &&
      componentCenterY >= 0.08 &&
      componentCenterY <= 0.92;
    const usefulSize = componentPixels.length >= minArea;

    if (usefulSize && centered) {
      for (const index of componentPixels) {
        outputMask[index] = 255;
      }
    }
  }

  let keptPixels = 0;
  for (const value of outputMask) {
    if (value > 0) keptPixels += 1;
  }

  if (keptPixels === 0) {
    for (const index of largestComponent) {
      outputMask[index] = 255;
    }
  }

  return outputMask;
}

function refineAlphaMask(alphaMask: Uint8ClampedArray, width: number, height: number) {
  const binaryMask = new Uint8ClampedArray(alphaMask.length);
  const cleanedMask = new Uint8ClampedArray(alphaMask.length);
  const tightenedMask = new Uint8ClampedArray(alphaMask.length);
  const refinedMask = new Uint8ClampedArray(alphaMask.length);

  for (let index = 0; index < alphaMask.length; index += 1) {
    binaryMask[index] = alphaMask[index] >= 132 ? 255 : 0;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let neighbors = 0;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) continue;

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) continue;
          if (binaryMask[sampleY * width + sampleX] > 0) neighbors += 1;
        }
      }

      cleanedMask[index] = neighbors >= 5 ? 255 : 0;
    }
  }

  const componentMask = keepMainPersonComponents(cleanedMask, width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let neighbors = 0;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) continue;

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) continue;
          if (componentMask[sampleY * width + sampleX] > 0) neighbors += 1;
        }
      }

      tightenedMask[index] = neighbors >= 6 ? 255 : 0;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let total = 0;
      let weightTotal = 0;

      for (let offsetY = -3; offsetY <= 3; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) continue;

        for (let offsetX = -3; offsetX <= 3; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) continue;

          const distance = Math.abs(offsetX) + Math.abs(offsetY);
          const weight = distance === 0 ? 8 : distance === 1 ? 5 : distance <= 3 ? 2 : 1;
          total += tightenedMask[sampleY * width + sampleX] * weight;
          weightTotal += weight;
        }
      }

      const feathered = weightTotal > 0 ? total / weightTotal : cleanedMask[index];
      const sourceAlpha = alphaMask[index];
      const softened = feathered > 16 && feathered < 240 ? feathered * 0.72 + sourceAlpha * 0.28 : feathered;
      const normalized = Math.max(0, Math.min(1, softened / 255));
      const smoothStep = normalized * normalized * (3 - 2 * normalized);
      const residueSuppressed = smoothStep < 0.45 ? smoothStep * smoothStep * 2.2 : smoothStep;
      refinedMask[index] = Math.max(0, Math.min(255, Math.round(residueSuppressed * 255)));
    }
  }

  return refinedMask;
}

function resizeAlphaMask(alphaMask: Uint8ClampedArray, sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
    return alphaMask;
  }

  const resizedMask = new Uint8ClampedArray(targetWidth * targetHeight);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) * (sourceHeight / targetHeight) - 0.5;
    const y0 = Math.max(0, Math.floor(sourceY));
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const yWeight = sourceY - y0;

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) * (sourceWidth / targetWidth) - 0.5;
      const x0 = Math.max(0, Math.floor(sourceX));
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const xWeight = sourceX - x0;

      const top =
        alphaMask[y0 * sourceWidth + x0] * (1 - xWeight) +
        alphaMask[y0 * sourceWidth + x1] * xWeight;
      const bottom =
        alphaMask[y1 * sourceWidth + x0] * (1 - xWeight) +
        alphaMask[y1 * sourceWidth + x1] * xWeight;

      resizedMask[y * targetWidth + x] = Math.round(top * (1 - yWeight) + bottom * yWeight);
    }
  }

  return resizedMask;
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
  const maskWidth = result.categoryMask?.width ?? result.confidenceMasks?.[0]?.width ?? image.naturalWidth;
  const maskHeight = result.categoryMask?.height ?? result.confidenceMasks?.[0]?.height ?? image.naturalHeight;
  const width = image.naturalWidth;
  const height = image.naturalHeight;

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
  const alphaMask = new Uint8ClampedArray(maskWidth * maskHeight);

  for (let pixelIndex = 0; pixelIndex < maskWidth * maskHeight; pixelIndex += 1) {
    alphaMask[pixelIndex] = getPersonAlpha(personMask, pixelIndex);
  }

  const refinedAlphaMask = resizeAlphaMask(
    refineAlphaMask(alphaMask, maskWidth, maskHeight),
    maskWidth,
    maskHeight,
    width,
    height
  );

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const alpha = refinedAlphaMask[pixelIndex] / 255;
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
