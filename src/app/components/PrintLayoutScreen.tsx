import { Screen, Btn, NavHeader } from "./ui";
import type { PhotoOptions } from "./PhotoOptionsScreen";
import { Printer, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  photoUrl: string;
  originalPhotoUrl?: string;
  options: PhotoOptions;
  onBack: () => void;
  onPrint: () => void;
}

const printTile1 = { w: 25.4, h: 25.4 };
const printTile2 = { w: 50.8, h: 50.8 };
const printTilePassport = { w: 35, h: 45 };

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getPrintTileHtml(url: string, width: number, height: number, bg: PhotoOptions["background"]) {
  const background =
    bg === "blue" ? "background:#2563EB;" : bg === "white" ? "background:white;" : "background:white;";

  return `
    <div class="photo-tile" style="width:${width}mm;height:${height}mm;${background}">
      <img src="${escapeAttribute(url)}" alt="">
    </div>
  `;
}

function getPrintSheetHtml(photoUrl: string, options: PhotoOptions) {
  const row = (count: number, width: number, height: number) =>
    `<div class="row">${Array.from({ length: count }, () =>
      getPrintTileHtml(photoUrl, width, height, options.background)
    ).join("")}</div>`;

  const rows =
    options.printSize === "2x2"
      ? Array.from({ length: 3 }, () => row(2, printTile2.w, printTile2.h)).join("")
      : options.printSize === "1x1"
      ? Array.from({ length: 6 }, () => row(4, printTile1.w, printTile1.h)).join("")
      : options.printSize === "passport"
      ? Array.from({ length: 4 }, () => row(3, printTilePassport.w, printTilePassport.h)).join("")
      : [
          row(2, printTile2.w, printTile2.h),
          row(4, printTile1.w, printTile1.h),
          row(4, printTile1.w, printTile1.h),
          row(2, printTile2.w, printTile2.h),
        ].join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Photobooth Print</title>
    <style>
      @page {
        size: A5 portrait;
        margin: 0;
      }

      html,
      body {
        width: 148mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        background: white;
      }

      * {
        box-sizing: border-box;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .sheet {
        width: 148mm;
        height: 210mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5mm;
        background: white;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .row {
        display: flex;
        gap: 1.5mm;
      }

      .photo-tile {
        overflow: hidden;
        flex: 0 0 auto;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .photo-tile img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 38%;
      }
    </style>
  </head>
  <body>
    <main class="sheet">${rows}</main>
    <script>
      window.addEventListener("load", function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 250);
      });
    </script>
  </body>
</html>`;
}

function PhotoTile({
  url,
  originalUrl,
  w,
  h,
  bg,
}: {
  url: string;
  originalUrl?: string;
  w: number;
  h: number;
  bg: PhotoOptions["background"];
}) {
  const [displayUrl, setDisplayUrl] = useState(url);

  useEffect(() => {
    setDisplayUrl(url);
  }, [url]);

  const bgStyle =
    bg === "blue"
      ? { backgroundColor: "#2563EB" }
      : bg === "white"
      ? { backgroundColor: "white" }
      : bg === "removed"
      ? { background: "repeating-conic-gradient(#E2E8F0 0% 25%, white 0% 50%) 0 0 / 8px 8px" }
      : {};
  return (
    <div
      style={{ width: w, height: h, ...bgStyle }}
      className="overflow-hidden border border-[#CBD5E1] flex-shrink-0"
    >
      <img
        src={displayUrl}
        alt="ID photo"
        className="w-full h-full object-cover object-[center_38%]"
        onError={() => {
          if (originalUrl && displayUrl !== originalUrl) {
            setDisplayUrl(originalUrl);
          }
        }}
      />
    </div>
  );
}

function PrintPhotoTile({
  url,
  originalUrl,
  w,
  h,
  bg,
}: {
  url: string;
  originalUrl?: string;
  w: number;
  h: number;
  bg: PhotoOptions["background"];
}) {
  const [displayUrl, setDisplayUrl] = useState(url);

  useEffect(() => {
    setDisplayUrl(url);
  }, [url]);

  const bgStyle =
    bg === "blue"
      ? { backgroundColor: "#2563EB" }
      : bg === "white"
      ? { backgroundColor: "white" }
      : {};

  return (
    <div className="print-photo-tile" style={{ width: `${w}mm`, height: `${h}mm`, ...bgStyle }}>
      <img
        src={displayUrl}
        alt=""
        onError={() => {
          if (originalUrl && displayUrl !== originalUrl) {
            setDisplayUrl(originalUrl);
          }
        }}
      />
    </div>
  );
}

export function PrintLayoutScreen({ photoUrl, originalPhotoUrl, options, onBack, onPrint }: Props) {
  const [zoom, setZoom] = useState(1);
  const printStartedRef = useRef(false);

  // A5 = 148 × 210 mm — render at 2.5px/mm → 370 × 525px
  const paperW = 370;
  const paperH = 525;

  // Tile sizes in px (at 2.5px/mm, 1 inch ≈ 63.5px, 2 inch ≈ 127px)
  const tile1 = { w: 63, h: 63 };
  const tile2 = { w: 127, h: 127 };
  const tilePassport = { w: 89, h: 114 };
  const finishPrint = useCallback(() => {
    if (!printStartedRef.current) return;
    printStartedRef.current = false;
    onPrint();
  }, [onPrint]);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") {
      onPrint();
      return;
    }

    printStartedRef.current = true;
    const printWindow = window.open("", "photobooth-print", "popup=yes,width=900,height=1200");

    if (!printWindow) {
      window.addEventListener("afterprint", finishPrint, { once: true });
      window.print();
      return;
    }

    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      printWindow.close();
      finishPrint();
    };

    printWindow.document.open();
    printWindow.document.write(getPrintSheetHtml(photoUrl, options));
    printWindow.document.close();
    printWindow.addEventListener("afterprint", finishOnce, { once: true });
    printWindow.addEventListener("pagehide", finishOnce, { once: true });
  }, [finishPrint, onPrint, options, photoUrl]);

  const renderLayout = () => {
    const bg = options.background;
    if (options.printSize === "2x2") {
      // 3 cols × 4 rows of 2x2
      const cols = 2;
      const rows = 3;
      return (
        <div className="flex flex-col gap-[4px] items-center justify-center h-full">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-[4px]">
              {Array.from({ length: cols }, (_, c) => (
                <PhotoTile key={c} url={photoUrl} originalUrl={originalPhotoUrl} w={tile2.w} h={tile2.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (options.printSize === "1x1") {
      const cols = 4;
      const rows = 6;
      return (
        <div className="flex flex-col gap-[3px] items-center justify-center h-full">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-[3px]">
              {Array.from({ length: cols }, (_, c) => (
                <PhotoTile key={c} url={photoUrl} originalUrl={originalPhotoUrl} w={tile1.w} h={tile1.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (options.printSize === "passport") {
      const cols = 3;
      const rows = 4;
      return (
        <div className="flex flex-col gap-[4px] items-center justify-center h-full">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-[4px]">
              {Array.from({ length: cols }, (_, c) => (
                <PhotoTile key={c} url={photoUrl} originalUrl={originalPhotoUrl} w={tilePassport.w} h={tilePassport.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    // Mixed
    return (
      <div className="flex flex-col gap-[4px] items-center justify-center h-full">
        <div className="flex gap-[4px]">
          <PhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={tile2.w} h={tile2.h} bg={bg} />
          <PhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={tile2.w} h={tile2.h} bg={bg} />
        </div>
        <div className="flex gap-[4px]">
          {Array.from({ length: 4 }, (_, i) => (
            <PhotoTile key={i} url={photoUrl} originalUrl={originalPhotoUrl} w={tile1.w} h={tile1.h} bg={bg} />
          ))}
        </div>
        <div className="flex gap-[4px]">
          {Array.from({ length: 4 }, (_, i) => (
            <PhotoTile key={i} url={photoUrl} originalUrl={originalPhotoUrl} w={tile1.w} h={tile1.h} bg={bg} />
          ))}
        </div>
        <div className="flex gap-[4px]">
          <PhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={tile2.w} h={tile2.h} bg={bg} />
          <PhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={tile2.w} h={tile2.h} bg={bg} />
        </div>
      </div>
    );
  };

  const printLayout = useMemo(() => {
    const bg = options.background;
    if (options.printSize === "2x2") {
      return (
        <div className="print-layout print-layout-center">
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="print-row">
              {Array.from({ length: 2 }, (_, col) => (
                <PrintPhotoTile key={col} url={photoUrl} originalUrl={originalPhotoUrl} w={printTile2.w} h={printTile2.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (options.printSize === "1x1") {
      return (
        <div className="print-layout print-layout-center">
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="print-row">
              {Array.from({ length: 4 }, (_, col) => (
                <PrintPhotoTile key={col} url={photoUrl} originalUrl={originalPhotoUrl} w={printTile1.w} h={printTile1.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (options.printSize === "passport") {
      return (
        <div className="print-layout print-layout-center">
          {Array.from({ length: 4 }, (_, row) => (
            <div key={row} className="print-row">
              {Array.from({ length: 3 }, (_, col) => (
                <PrintPhotoTile key={col} url={photoUrl} originalUrl={originalPhotoUrl} w={printTilePassport.w} h={printTilePassport.h} bg={bg} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="print-layout print-layout-center">
        <div className="print-row">
          <PrintPhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={printTile2.w} h={printTile2.h} bg={bg} />
          <PrintPhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={printTile2.w} h={printTile2.h} bg={bg} />
        </div>
        <div className="print-row">
          {Array.from({ length: 4 }, (_, index) => (
            <PrintPhotoTile key={index} url={photoUrl} originalUrl={originalPhotoUrl} w={printTile1.w} h={printTile1.h} bg={bg} />
          ))}
        </div>
        <div className="print-row">
          {Array.from({ length: 4 }, (_, index) => (
            <PrintPhotoTile key={index} url={photoUrl} originalUrl={originalPhotoUrl} w={printTile1.w} h={printTile1.h} bg={bg} />
          ))}
        </div>
        <div className="print-row">
          <PrintPhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={printTile2.w} h={printTile2.h} bg={bg} />
          <PrintPhotoTile url={photoUrl} originalUrl={originalPhotoUrl} w={printTile2.w} h={printTile2.h} bg={bg} />
        </div>
      </div>
    );
  }, [options.background, options.printSize, originalPhotoUrl, photoUrl]);

  return (
    <Screen>
      <style>{`
        .print-sheet {
          display: none;
        }

        @page {
          size: A5 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 148mm;
            height: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-sheet,
          .print-sheet * {
            visibility: visible !important;
          }

          .print-sheet {
            display: block !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            overflow: hidden !important;
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print-layout {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 1.5mm;
          }

          .print-layout-center {
            align-items: center;
            justify-content: center;
          }

          .print-row {
            display: flex;
            gap: 1.5mm;
          }

          .print-photo-tile {
            overflow: hidden;
            flex: 0 0 auto;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print-photo-tile img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 38%;
          }
        }
      `}</style>
      <NavHeader onBack={onBack} title="Print Sheet" step={4} totalSteps={5} />

      <div className="print-sheet" aria-hidden="true">
        {printLayout}
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-4 overflow-hidden">
        {/* Paper info bar */}
        <div className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] px-4 py-2.5 shadow-sm text-sm">
          <span className="text-[#64748B]">A5 Photo Paper</span>
          <span className="w-px h-4 bg-[#E2E8F0]" />
          <span className="text-[#64748B]">148 × 210 mm</span>
          <span className="w-px h-4 bg-[#E2E8F0]" />
          <span className="font-semibold text-[#2563EB] capitalize">{options.printSize} layout</span>
        </div>

        {/* Paper preview */}
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div
            className="relative bg-white shadow-2xl border border-[#CBD5E1] transition-transform duration-200"
            style={{
              width: paperW,
              height: paperH,
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Rulers */}
            <div className="absolute -top-5 left-0 right-0 flex items-center justify-between px-2">
              <span className="text-[9px] text-[#94A3B8]">0</span>
              <span className="text-[9px] text-[#94A3B8]">148mm</span>
            </div>
            <div className="absolute -left-5 top-0 bottom-0 flex flex-col items-center justify-between py-2">
              <span className="text-[9px] text-[#94A3B8]">0</span>
              <span className="text-[9px] text-[#94A3B8] rotate-90">210</span>
            </div>
            {/* Margin guides */}
            <div className="absolute inset-[8px] border border-dashed border-blue-200 pointer-events-none" />
            {renderLayout()}
          </div>
        </div>

        {/* Zoom + actions */}
        <div className="flex items-center justify-between gap-4 w-full max-w-md">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E2E8F0] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <ZoomOut size={16} color="#64748B" />
            </button>
            <span className="text-sm font-semibold text-[#0F172A] min-w-[44px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <ZoomIn size={16} color="#64748B" />
            </button>
          </div>

          <div className="flex gap-3 flex-1">
            <Btn variant="secondary" onClick={onBack} className="flex-1">
              Back
            </Btn>
            <Btn onClick={handlePrint} className="flex-1">
              <Printer size={18} />
              Print
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
