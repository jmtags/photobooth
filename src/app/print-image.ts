import type { PhotoOptions } from "./components/PhotoOptionsScreen";
import type { PhotoBoothLayout, PhotoBoothTheme } from "./components/PhotoBoothOptionsScreen";

const dpi = 300;
const pxPerMm = dpi / 25.4;
const a5 = {
  widthMm: 148,
  heightMm: 210,
  widthPx: Math.round(148 * pxPerMm),
  heightPx: Math.round(210 * pxPerMm),
};

function mm(value: number) {
  return Math.round(value * pxPerMm);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load print image."));
    image.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  positionY = 0.5
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) * positionY;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function fillBackground(ctx: CanvasRenderingContext2D, background: string) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, a5.widthPx, a5.heightPx);
}

function drawPhotoTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  background: PhotoOptions["background"]
) {
  ctx.fillStyle = background === "blue" ? "#2563EB" : "white";
  ctx.fillRect(x, y, width, height);
  drawCover(ctx, image, x, y, width, height, 0.38);
}

export async function createIdPrintImage(photoUrl: string, options: PhotoOptions) {
  const image = await loadImage(photoUrl);
  const canvas = document.createElement("canvas");
  canvas.width = a5.widthPx;
  canvas.height = a5.heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare print sheet.");

  fillBackground(ctx, "white");

  const gap = mm(1.5);
  const tile1 = { width: mm(25.4), height: mm(25.4) };
  const tile2 = { width: mm(50.8), height: mm(50.8) };
  const passport = { width: mm(35), height: mm(45) };

  const drawRow = (count: number, tile: { width: number; height: number }, y: number) => {
    const totalWidth = count * tile.width + (count - 1) * gap;
    let x = Math.round((a5.widthPx - totalWidth) / 2);
    for (let index = 0; index < count; index += 1) {
      drawPhotoTile(ctx, image, x, y, tile.width, tile.height, options.background);
      x += tile.width + gap;
    }
  };

  const rows =
    options.printSize === "2x2"
      ? Array.from({ length: 3 }, () => ({ count: 2, tile: tile2 }))
      : options.printSize === "1x1"
      ? Array.from({ length: 6 }, () => ({ count: 4, tile: tile1 }))
      : options.printSize === "passport"
      ? Array.from({ length: 4 }, () => ({ count: 3, tile: passport }))
      : [
          { count: 2, tile: tile2 },
          { count: 4, tile: tile1 },
          { count: 4, tile: tile1 },
          { count: 2, tile: tile2 },
        ];

  const contentHeight =
    rows.reduce((total, row) => total + row.tile.height, 0) + Math.max(0, rows.length - 1) * gap;
  let y = Math.round((a5.heightPx - contentHeight) / 2);
  rows.forEach((row) => {
    drawRow(row.count, row.tile, y);
    y += row.tile.height + gap;
  });

  return canvas.toDataURL("image/jpeg", 0.94);
}

type BoothThemeStyle = {
  label: string;
  background: string;
  frame: string;
  border: string;
  text: string;
};

const boothThemes: Record<PhotoBoothTheme, BoothThemeStyle> = {
  classic: {
    label: "Classic",
    background: "white",
    frame: "white",
    border: "#CBD5E1",
    text: "#0F172A",
  },
  pastel: {
    label: "Pastel",
    background: "pastel",
    frame: "white",
    border: "#F9A8D4",
    text: "#0F172A",
  },
  bold: {
    label: "Bold",
    background: "#0F172A",
    frame: "#111827",
    border: "#F59E0B",
    text: "white",
  },
};

function fillBoothBackground(ctx: CanvasRenderingContext2D, theme: PhotoBoothTheme) {
  if (theme === "pastel") {
    const gradient = ctx.createLinearGradient(0, 0, a5.widthPx, a5.heightPx);
    gradient.addColorStop(0, "#FCE7F3");
    gradient.addColorStop(0.48, "#E0F2FE");
    gradient.addColorStop(1, "#D1FAE5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, a5.widthPx, a5.heightPx);
    return;
  }

  fillBackground(ctx, boothThemes[theme].background);
}

function drawFramedBoothPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: BoothThemeStyle,
  borderMm = 1.2
) {
  const border = mm(borderMm);
  ctx.fillStyle = theme.border;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = theme.frame;
  ctx.fillRect(x + border, y + border, width - border * 2, height - border * 2);
  drawCover(ctx, image, x + border, y + border, width - border * 2, height - border * 2);
}

export async function createBoothPrintImage(
  photoUrls: string[],
  theme: PhotoBoothTheme,
  layout: PhotoBoothLayout
) {
  const images = await Promise.all(photoUrls.slice(0, 4).map(loadImage));
  const canvas = document.createElement("canvas");
  canvas.width = a5.widthPx;
  canvas.height = a5.heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare print sheet.");

  const currentTheme = boothThemes[theme];
  fillBoothBackground(ctx, theme);

  ctx.fillStyle = currentTheme.text;
  ctx.font = `700 ${mm(3.5)}px Arial, sans-serif`;
  ctx.textAlign = "center";

  const titleY = mm(18);
  ctx.fillText(`${currentTheme.label.toUpperCase()} PHOTO BOOTH`, a5.widthPx / 2, titleY);

  if (layout === "grid") {
    const photoWidth = mm(58);
    const photoHeight = mm(72);
    const gap = mm(3);
    const totalWidth = photoWidth * 2 + gap;
    const totalHeight = photoHeight * 2 + gap;
    const startX = Math.round((a5.widthPx - totalWidth) / 2);
    const startY = Math.round((a5.heightPx - totalHeight) / 2) + mm(6);

    images.forEach((image, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      drawFramedBoothPhoto(
        ctx,
        image,
        startX + col * (photoWidth + gap),
        startY + row * (photoHeight + gap),
        photoWidth,
        photoHeight,
        currentTheme
      );
    });
  } else if (layout === "film") {
    const stripWidth = mm(92);
    const frameWidth = mm(76);
    const frameHeight = mm(38);
    const gap = mm(2);
    const framePadX = mm(8);
    const framePadY = mm(3.5);
    const stripHeight = images.length * (frameHeight + framePadY * 2) + (images.length - 1) * gap;
    const stripX = Math.round((a5.widthPx - stripWidth) / 2);
    const stripY = Math.round((a5.heightPx - stripHeight) / 2) + mm(7);

    ctx.fillStyle = theme === "bold" ? "#020617" : "#111827";
    ctx.fillRect(stripX, stripY, stripWidth, stripHeight);

    images.forEach((image, index) => {
      const frameY = stripY + index * (frameHeight + framePadY * 2 + gap) + framePadY;
      const frameX = stripX + framePadX;
      drawFramedBoothPhoto(ctx, image, frameX, frameY, frameWidth, frameHeight, {
        ...currentTheme,
        border: "white",
        frame: "white",
      });
    });
  } else {
    const photoWidth = mm(106);
    const photoHeight = mm(43);
    const gap = mm(2.5);
    const totalHeight = images.length * photoHeight + (images.length - 1) * gap;
    const x = Math.round((a5.widthPx - photoWidth) / 2);
    let y = Math.round((a5.heightPx - totalHeight) / 2) + mm(7);

    images.forEach((image) => {
      drawFramedBoothPhoto(ctx, image, x, y, photoWidth, photoHeight, currentTheme);
      y += photoHeight + gap;
    });
  }

  return canvas.toDataURL("image/jpeg", 0.94);
}
