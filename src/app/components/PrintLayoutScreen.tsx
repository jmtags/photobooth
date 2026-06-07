import { Screen, Btn, NavHeader } from "./ui";
import type { PhotoOptions } from "./PhotoOptionsScreen";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface Props {
  photoUrl: string;
  options: PhotoOptions;
  onBack: () => void;
  onPrint: () => void;
}

function PhotoTile({ url, w, h, bg }: { url: string; w: number; h: number; bg: PhotoOptions["background"] }) {
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
      className="overflow-hidden border border-[#CBD5E1] flex-shrink-0 flex items-center justify-center"
    >
      <img
        src={url}
        alt="ID photo"
        className="w-full h-full object-contain object-center"
      />
    </div>
  );
}

export function PrintLayoutScreen({ photoUrl, options, onBack, onPrint }: Props) {
  const [zoom, setZoom] = useState(1);

  // A5 = 148 × 210 mm — render at 2.5px/mm → 370 × 525px
  const paperW = 370;
  const paperH = 525;

  // Tile sizes in px (at 2.5px/mm, 1 inch ≈ 63.5px, 2 inch ≈ 127px)
  const tile1 = { w: 63, h: 63 };
  const tile2 = { w: 127, h: 127 };
  const tilePassport = { w: 89, h: 114 };

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
                <PhotoTile key={c} url={photoUrl} w={tile2.w} h={tile2.h} bg={bg} />
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
                <PhotoTile key={c} url={photoUrl} w={tile1.w} h={tile1.h} bg={bg} />
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
                <PhotoTile key={c} url={photoUrl} w={tilePassport.w} h={tilePassport.h} bg={bg} />
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
          <PhotoTile url={photoUrl} w={tile2.w} h={tile2.h} bg={bg} />
          <PhotoTile url={photoUrl} w={tile2.w} h={tile2.h} bg={bg} />
        </div>
        <div className="flex gap-[4px]">
          {Array.from({ length: 4 }, (_, i) => (
            <PhotoTile key={i} url={photoUrl} w={tile1.w} h={tile1.h} bg={bg} />
          ))}
        </div>
        <div className="flex gap-[4px]">
          {Array.from({ length: 4 }, (_, i) => (
            <PhotoTile key={i} url={photoUrl} w={tile1.w} h={tile1.h} bg={bg} />
          ))}
        </div>
        <div className="flex gap-[4px]">
          <PhotoTile url={photoUrl} w={tile2.w} h={tile2.h} bg={bg} />
          <PhotoTile url={photoUrl} w={tile2.w} h={tile2.h} bg={bg} />
        </div>
      </div>
    );
  };

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Print Layout" step={6} totalSteps={7} />

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
              Edit
            </Btn>
            <Btn onClick={onPrint} className="flex-1">
              Print
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
