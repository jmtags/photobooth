import { Screen, Btn, NavHeader, Card } from "./ui";
import type { PhotoOptions } from "./PhotoOptionsScreen";
import { Check, ImageIcon } from "lucide-react";

interface Props {
  photoUrl: string;
  options: PhotoOptions;
  onBack: () => void;
  onGenerate: () => void;
}

const bgLabels: Record<PhotoOptions["background"], string> = {
  original: "Original Background",
  white: "White Background",
  blue: "Blue Background",
  removed: "Background Removed",
};

const attireLabels: Record<PhotoOptions["attire"], string> = {
  original: "Original Clothes",
  "male-office": "Male Office Attire",
  "female-office": "Female Office Attire",
};

const sizeLabels: Record<PhotoOptions["printSize"], string> = {
  "1x1": "1×1 inch",
  "2x2": "2×2 inch",
  passport: "Passport Size",
  mixed: "Mixed Layout",
};

const bgColors: Record<PhotoOptions["background"], string> = {
  original: "transparent",
  white: "white",
  blue: "#2563EB",
  removed: "repeating-conic-gradient(#E2E8F0 0% 25%, white 0% 50%) 0 0 / 16px 16px",
};

export function LivePreviewScreen({ photoUrl, options, onBack, onGenerate }: Props) {
  const bgStyle =
    options.background === "removed"
      ? { background: bgColors.removed }
      : options.background === "blue"
      ? { backgroundColor: "#2563EB" }
      : options.background === "white"
      ? { backgroundColor: "white" }
      : {};

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Live Preview" step={5} totalSteps={7} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: processed photo */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Processed Photo</h2>
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl border border-[#E2E8F0] aspect-[3/4] w-full max-w-xs mx-auto"
                style={bgStyle}
              >
                <img
                  src={photoUrl}
                  alt="Processed portrait"
                  className="w-full h-full object-cover mix-blend-multiply"
                  style={{
                    filter: [
                      options.brightness ? "brightness(1.1) contrast(1.05)" : "",
                      options.smoothing ? "blur(0.3px) saturate(1.05)" : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined,
                  }}
                />
                {/* Applied effects badge */}
                {(options.smoothing || options.brightness || options.skinTone) && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                    <p className="text-white text-xs font-semibold">Enhancements Applied</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {options.smoothing && (
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Smoothing</span>
                      )}
                      {options.brightness && (
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Brightness</span>
                      )}
                      {options.skinTone && (
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Skin Tone</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: options summary */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Selected Options</h2>

              <Card className="p-4">
                <div className="flex flex-col gap-3">
                  {[
                    { icon: <ImageIcon size={16} color="#2563EB" />, label: "Background", value: bgLabels[options.background] },
                    {
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="5" r="3" stroke="#2563EB" strokeWidth="1.5" />
                          <path d="M2 14 Q8 10 14 14" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      ),
                      label: "Attire",
                      value: attireLabels[options.attire],
                    },
                    {
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="1" y="1" width="14" height="14" rx="2" stroke="#2563EB" strokeWidth="1.5" />
                          <rect x="4" y="4" width="3" height="4" rx="1" fill="#2563EB" />
                          <rect x="9" y="4" width="3" height="4" rx="1" fill="#2563EB" opacity="0.5" />
                          <rect x="4" y="10" width="3" height="2" rx="1" fill="#2563EB" opacity="0.5" />
                          <rect x="9" y="10" width="3" height="2" rx="1" fill="#2563EB" />
                        </svg>
                      ),
                      label: "Print Size",
                      value: sizeLabels[options.printSize],
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 py-2 border-b border-[#F8FAFC] last:border-0">
                      <div className="flex items-center gap-2 text-[#64748B]">
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#0F172A]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Retouch summary */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-[#0F172A] mb-3">Retouching</p>
                {[
                  { key: "smoothing", label: "Face Smoothing", v: options.smoothing },
                  { key: "brightness", label: "Brightness", v: options.brightness },
                  { key: "skinTone", label: "Skin Tone", v: options.skinTone },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-0">
                    <span className="text-sm text-[#64748B]">{item.label}</span>
                    <div
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        item.v ? "text-[#22C55E]" : "text-[#94A3B8]"
                      }`}
                    >
                      {item.v ? (
                        <>
                          <Check size={12} />
                          On
                        </>
                      ) : (
                        "Off"
                      )}
                    </div>
                  </div>
                ))}
              </Card>

              <div className="flex gap-3 mt-auto">
                <Btn variant="secondary" onClick={onBack} className="flex-1">
                  Back
                </Btn>
                <Btn onClick={onGenerate} className="flex-1">
                  Generate Layout
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
