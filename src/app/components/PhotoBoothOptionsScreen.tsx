import { Check, Film, Grid2X2, Images, Sparkles } from "lucide-react";
import { Btn, NavHeader, Screen } from "./ui";

export type PhotoBoothTheme = "classic" | "pastel" | "bold";
export type PhotoBoothLayout = "strip" | "grid" | "film";

interface Props {
  theme: PhotoBoothTheme;
  layout: PhotoBoothLayout;
  onThemeChange: (theme: PhotoBoothTheme) => void;
  onLayoutChange: (layout: PhotoBoothLayout) => void;
  onBack: () => void;
  onContinue: () => void;
}

function Choice({
  label,
  hint,
  selected,
  icon,
  swatch,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  icon: React.ReactNode;
  swatch?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[104px] rounded-2xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-[#2563EB] bg-blue-50 shadow-md shadow-blue-100"
          : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            selected ? "bg-[#2563EB] text-white" : "bg-[#F8FAFC] text-[#64748B]"
          }`}
        >
          {swatch ?? icon}
        </div>
        <div className="min-w-0">
          <p className={`text-lg font-bold ${selected ? "text-[#2563EB]" : "text-[#0F172A]"}`}>{label}</p>
          <p className="text-sm text-[#64748B] mt-1">{hint}</p>
        </div>
      </div>
      {selected && (
        <div className="absolute right-3 top-3 w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
          <Check size={16} />
        </div>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold text-[#0F172A]">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

export function PhotoBoothOptionsScreen({
  theme,
  layout,
  onThemeChange,
  onLayoutChange,
  onBack,
  onContinue,
}: Props) {
  return (
    <Screen>
      <NavHeader onBack={onBack} title="Pick Booth Style" step={3} totalSteps={5} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-col gap-7">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-2xl font-extrabold text-[#0F172A]">Choose your print style.</p>
            <p className="text-base text-[#64748B] mt-1">Your four photos will print together on A5.</p>
          </div>

          <Section title="1. Theme">
            <Choice
              label="Classic"
              hint="Clean white"
              selected={theme === "classic"}
              onClick={() => onThemeChange("classic")}
              icon={<Sparkles size={24} />}
              swatch={<div className="w-8 h-8 rounded-lg bg-white border border-[#CBD5E1]" />}
            />
            <Choice
              label="Pastel"
              hint="Soft colors"
              selected={theme === "pastel"}
              onClick={() => onThemeChange("pastel")}
              icon={<Sparkles size={24} />}
              swatch={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-200 via-sky-200 to-emerald-200" />}
            />
            <Choice
              label="Bold"
              hint="Party frame"
              selected={theme === "bold"}
              onClick={() => onThemeChange("bold")}
              icon={<Sparkles size={24} />}
              swatch={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F172A] via-[#2563EB] to-[#F59E0B]" />}
            />
          </Section>

          <Section title="2. Layout">
            <Choice
              label="Strip"
              hint="Tall 4-photo strip"
              selected={layout === "strip"}
              onClick={() => onLayoutChange("strip")}
              icon={<Images size={24} />}
            />
            <Choice
              label="Grid"
              hint="2 by 2 photos"
              selected={layout === "grid"}
              onClick={() => onLayoutChange("grid")}
              icon={<Grid2X2 size={24} />}
            />
            <Choice
              label="Film"
              hint="Classic film look"
              selected={layout === "film"}
              onClick={() => onLayoutChange("film")}
              icon={<Film size={24} />}
            />
          </Section>

          <div className="sticky bottom-0 bg-[#F8FAFC] pt-2 pb-4 flex gap-3">
            <Btn variant="secondary" onClick={onBack} className="flex-1">
              Retake
            </Btn>
            <Btn onClick={onContinue} className="flex-[2]">
              Preview Print
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
