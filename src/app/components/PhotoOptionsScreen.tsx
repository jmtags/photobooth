import { Screen, Btn, NavHeader } from "./ui";
import { Briefcase, Check, Grid2X2, ImageIcon, LayoutGrid, Shirt, Square, User } from "lucide-react";

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
  processing?: boolean;
  processError?: string | null;
}

function BigChoice({
  label,
  hint,
  selected,
  icon,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  icon: React.ReactNode;
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
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-lg font-bold ${selected ? "text-[#2563EB]" : "text-[#0F172A]"}`}>{label}</p>
          {hint && <p className="text-sm text-[#64748B] mt-1">{hint}</p>}
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

function SimpleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold text-[#0F172A]">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

export function PhotoOptionsScreen({ options, onChange, onBack, onContinue, processing, processError }: Props) {
  const set = <K extends keyof PhotoOptions>(key: K, val: PhotoOptions[K]) =>
    onChange({ ...options, [key]: val });

  return (
    <Screen>
      <NavHeader onBack={onBack} title="Pick Style" step={2} totalSteps={5} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <div className="max-w-3xl mx-auto flex flex-col gap-7">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-2xl font-extrabold text-[#0F172A]">Choose what you want.</p>
            <p className="text-base text-[#64748B] mt-1">Big buttons. No tricky settings.</p>
          </div>

          <SimpleSection title="1. Background">
            <BigChoice
              label="White"
              hint="Best for IDs"
              selected={options.background === "white"}
              onClick={() => set("background", "white")}
              icon={<div className="w-7 h-7 rounded-lg bg-white border border-[#CBD5E1]" />}
            />
            <BigChoice
              label="Blue"
              hint="Blue ID photo"
              selected={options.background === "blue"}
              onClick={() => set("background", "blue")}
              icon={<div className="w-7 h-7 rounded-lg bg-[#2563EB]" />}
            />
            <BigChoice
              label="Keep"
              hint="No change"
              selected={options.background === "original"}
              onClick={() => set("background", "original")}
              icon={<ImageIcon size={24} />}
            />
          </SimpleSection>

          <SimpleSection title="2. Clothes">
            <BigChoice
              label="Keep"
              hint="Use my clothes"
              selected={options.attire === "original"}
              onClick={() => set("attire", "original")}
              icon={<User size={24} />}
            />
            <BigChoice
              label="Office"
              hint="Jacket and shirt"
              selected={options.attire === "male-office"}
              onClick={() => set("attire", "male-office")}
              icon={<Briefcase size={24} />}
            />
            <BigChoice
              label="Formal"
              hint="Blazer style"
              selected={options.attire === "female-office"}
              onClick={() => set("attire", "female-office")}
              icon={<Shirt size={24} />}
            />
          </SimpleSection>

          <SimpleSection title="3. Print Size">
            <BigChoice
              label="2 x 2"
              hint="Most common"
              selected={options.printSize === "2x2"}
              onClick={() => set("printSize", "2x2")}
              icon={<Square size={26} />}
            />
            <BigChoice
              label="1 x 1"
              hint="Small photos"
              selected={options.printSize === "1x1"}
              onClick={() => set("printSize", "1x1")}
              icon={<Grid2X2 size={26} />}
            />
            <BigChoice
              label="Mix"
              hint="Both sizes"
              selected={options.printSize === "mixed"}
              onClick={() => set("printSize", "mixed")}
              icon={<LayoutGrid size={26} />}
            />
          </SimpleSection>

          {processError && (
            <p className="text-sm text-[#EF4444] bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {processError}
            </p>
          )}

          <div className="sticky bottom-0 bg-[#F8FAFC] pt-2 pb-4 flex gap-3">
            <Btn variant="secondary" onClick={onBack} className="flex-1">
              Back
            </Btn>
            <Btn onClick={onContinue} disabled={processing} className="flex-[2]">
              {processing ? "Making..." : "Make My Photo"}
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
