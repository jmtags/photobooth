import { Screen, Btn, NavHeader, OptionCard, ToggleRow, SectionHeader } from "./ui";
import { User, Briefcase, Palette, Scissors, LayoutGrid, Square } from "lucide-react";

export interface PhotoOptions {
  background: "original" | "white" | "blue" | "removed";
  attire: "original" | "male-office" | "female-office";
  smoothing: boolean;
  brightness: boolean;
  skinTone: boolean;
  printSize: "1x1" | "2x2" | "passport" | "mixed";
}

interface Props {
  options: PhotoOptions;
  onChange: (o: PhotoOptions) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PhotoOptionsScreen({ options, onChange, onBack, onContinue }: Props) {
  const set = <K extends keyof PhotoOptions>(key: K, val: PhotoOptions[K]) =>
    onChange({ ...options, [key]: val });

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Customize Photo" step={4} totalSteps={7} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Section A: Background */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <SectionHeader title="Background" subtitle="Choose the background style" />
            <div className="flex gap-3 flex-wrap">
              <OptionCard
                label="Original"
                selected={options.background === "original"}
                onClick={() => set("background", "original")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="2" width="16" height="16" rx="3" fill={options.background === "original" ? "white" : "#94A3B8"} />
                    <circle cx="7" cy="7" r="2" fill={options.background === "original" ? "#93C5FD" : "#CBD5E1"} />
                    <path d="M2 14L7 9L11 13L14 10L18 14" stroke={options.background === "original" ? "#93C5FD" : "#CBD5E1"} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                }
              />
              <OptionCard
                label="White"
                selected={options.background === "white"}
                onClick={() => set("background", "white")}
                icon={<div className={`w-5 h-5 rounded border-2 ${options.background === "white" ? "border-white bg-white" : "border-[#CBD5E1] bg-white"}`} />}
              />
              <OptionCard
                label="Blue"
                selected={options.background === "blue"}
                onClick={() => set("background", "blue")}
                icon={<div className={`w-5 h-5 rounded ${options.background === "blue" ? "bg-white" : "bg-[#2563EB]"}`} />}
              />
              <OptionCard
                label="Removed"
                selected={options.background === "removed"}
                onClick={() => set("background", "removed")}
                icon={<Scissors size={20} color={options.background === "removed" ? "white" : "#94A3B8"} />}
              />
            </div>
          </div>

          {/* Section B: Attire */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <SectionHeader title="Attire" subtitle="Choose clothing style" />
            <div className="flex gap-3 flex-wrap">
              <OptionCard
                label="Original"
                selected={options.attire === "original"}
                onClick={() => set("attire", "original")}
                icon={<User size={20} color={options.attire === "original" ? "white" : "#94A3B8"} />}
              />
              <OptionCard
                label="Male Office"
                selected={options.attire === "male-office"}
                onClick={() => set("attire", "male-office")}
                icon={<Briefcase size={20} color={options.attire === "male-office" ? "white" : "#94A3B8"} />}
              />
              <OptionCard
                label="Female Office"
                selected={options.attire === "female-office"}
                onClick={() => set("attire", "female-office")}
                icon={<Palette size={20} color={options.attire === "female-office" ? "white" : "#94A3B8"} />}
              />
            </div>
          </div>

          {/* Section C: Retouch */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <SectionHeader title="Retouch" subtitle="AI enhancement options" />
            <ToggleRow
              label="Face Smoothing"
              description="Reduce blemishes and skin imperfections"
              value={options.smoothing}
              onChange={(v) => set("smoothing", v)}
            />
            <ToggleRow
              label="Brightness Adjustment"
              description="Auto-balance exposure and lighting"
              value={options.brightness}
              onChange={(v) => set("brightness", v)}
            />
            <ToggleRow
              label="Skin Tone Enhancement"
              description="Natural skin tone correction"
              value={options.skinTone}
              onChange={(v) => set("skinTone", v)}
            />
          </div>

          {/* Section D: Print Size */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <SectionHeader title="Print Size" subtitle="Select your ID photo format" />
            <div className="flex gap-3 flex-wrap">
              <OptionCard
                label="1 × 1 inch"
                selected={options.printSize === "1x1"}
                onClick={() => set("printSize", "1x1")}
                icon={<Square size={16} color={options.printSize === "1x1" ? "white" : "#94A3B8"} />}
              />
              <OptionCard
                label="2 × 2 inch"
                selected={options.printSize === "2x2"}
                onClick={() => set("printSize", "2x2")}
                icon={<Square size={20} color={options.printSize === "2x2" ? "white" : "#94A3B8"} />}
              />
              <OptionCard
                label="Passport"
                selected={options.printSize === "passport"}
                onClick={() => set("printSize", "passport")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke={options.printSize === "passport" ? "white" : "#94A3B8"} strokeWidth="1.5" />
                    <circle cx="10" cy="9" r="3" stroke={options.printSize === "passport" ? "white" : "#94A3B8"} strokeWidth="1.2" />
                    <path d="M5 15 Q10 12 15 15" stroke={options.printSize === "passport" ? "white" : "#94A3B8"} strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  </svg>
                }
              />
              <OptionCard
                label="Mixed Layout"
                selected={options.printSize === "mixed"}
                onClick={() => set("printSize", "mixed")}
                icon={<LayoutGrid size={20} color={options.printSize === "mixed" ? "white" : "#94A3B8"} />}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Btn variant="secondary" onClick={onBack} className="flex-1">
              Back
            </Btn>
            <Btn onClick={onContinue} className="flex-1">
              Preview Result
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
