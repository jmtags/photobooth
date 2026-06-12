import { Check, Film, Grid2X2, Images, Sparkles } from "lucide-react";
import { Btn, NavHeader, Screen } from "./ui";

export type PhotoBoothTheme = "classic" | "pastel" | "bold";
export type PhotoBoothLayout = "strip" | "grid" | "film";

interface Props {
  photoUrls: string[];
  theme: PhotoBoothTheme;
  layout: PhotoBoothLayout;
  onThemeChange: (theme: PhotoBoothTheme) => void;
  onLayoutChange: (layout: PhotoBoothLayout) => void;
  onBack: () => void;
  onContinue: () => void;
}

const themePreviewClasses: Record<
  PhotoBoothTheme,
  {
    label: string;
    sheet: string;
    text: string;
    frame: string;
    accent: string;
  }
> = {
  classic: {
    label: "Classic",
    sheet: "bg-white",
    text: "text-[#0F172A]",
    frame: "border-white bg-white",
    accent: "bg-[#2563EB]",
  },
  pastel: {
    label: "Pastel",
    sheet: "bg-gradient-to-br from-pink-100 via-sky-100 to-emerald-100",
    text: "text-[#0F172A]",
    frame: "border-white bg-white",
    accent: "bg-pink-300",
  },
  bold: {
    label: "Bold",
    sheet: "bg-[#0F172A]",
    text: "text-white",
    frame: "border-[#F59E0B] bg-[#111827]",
    accent: "bg-[#F59E0B]",
  },
};

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

function PreviewPhoto({
  url,
  index,
  className,
  frameClass,
}: {
  url?: string;
  index: number;
  className: string;
  frameClass: string;
}) {
  return (
    <div className={`overflow-hidden border-4 shadow-sm ${frameClass} ${className}`}>
      {url ? (
        <img src={url} alt={`Photo booth preview ${index + 1}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-bold text-slate-400">
          {index + 1}
        </div>
      )}
    </div>
  );
}

function StylePreview({
  photoUrls,
  theme,
  layout,
}: {
  photoUrls: string[];
  theme: PhotoBoothTheme;
  layout: PhotoBoothLayout;
}) {
  const currentTheme = themePreviewClasses[theme];
  const photos = Array.from({ length: 4 }, (_, index) => photoUrls[index]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#0F172A]">Preview</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-[#2563EB] shadow-sm ring-1 ring-[#E2E8F0]">
          {currentTheme.label} / {layout}
        </span>
      </div>

      <div className="flex justify-center rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div
          className={`flex h-[336px] w-[238px] flex-col items-center justify-center gap-2 border border-[#CBD5E1] p-4 shadow-xl sm:h-[390px] sm:w-[276px] ${currentTheme.sheet}`}
        >
          <div className={`text-center text-[11px] font-extrabold uppercase tracking-[0.18em] ${currentTheme.text}`}>
            Photo Booth
          </div>

          {layout === "grid" ? (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((url, index) => (
                <PreviewPhoto
                  key={index}
                  url={url}
                  index={index}
                  frameClass={currentTheme.frame}
                  className="h-[112px] w-[92px]"
                />
              ))}
            </div>
          ) : layout === "film" ? (
            <div className="flex flex-col gap-1.5 bg-[#111827] p-2">
              {photos.map((url, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, white 0 8px, transparent 8px 24px) top / 100% 6px no-repeat, repeating-linear-gradient(90deg, white 0 8px, transparent 8px 24px) bottom / 100% 6px no-repeat",
                  }}
                >
                  <PreviewPhoto
                    url={url}
                    index={index}
                    frameClass="border-white bg-white"
                    className="h-[62px] w-[166px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {photos.map((url, index) => (
                <PreviewPhoto
                  key={index}
                  url={url}
                  index={index}
                  frameClass={currentTheme.frame}
                  className="h-[72px] w-[196px]"
                />
              ))}
            </div>
          )}

          <div className={`mt-1 h-1.5 w-16 rounded-full ${currentTheme.accent}`} />
        </div>
      </div>
    </section>
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
  photoUrls,
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex flex-col gap-7">
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
          </div>

          <div className="lg:sticky lg:top-4">
            <StylePreview photoUrls={photoUrls} theme={theme} layout={layout} />
          </div>

          <div className="sticky bottom-0 bg-[#F8FAFC] pt-2 pb-4 flex gap-3 lg:col-span-2">
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
