import { Screen, Btn, FeatureChip, Logo } from "./ui";

interface Props {
  appMode?: "id-photo" | "photo-booth";
  onStart: () => void;
  onAdmin: () => void;
}

export function WelcomeScreen({ appMode = "id-photo", onStart, onAdmin }: Props) {
  const isPhotoBooth = appMode === "photo-booth";

  return (
    <Screen className="items-center justify-between">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-6 py-4">
        <Logo size="md" />
        <button
          type="button"
          onClick={onAdmin}
          className="text-xs text-[#64748B] hover:text-[#2563EB] transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          Admin
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto gap-8">
        {/* Illustration */}
        <div className="w-full max-w-xs mx-auto">
          <svg viewBox="0 0 320 240" fill="none" className="w-full">
            {/* Background */}
            <rect width="320" height="240" rx="24" fill="#EFF6FF" />
            {/* Photo frame */}
            <rect x="80" y="30" width="160" height="140" rx="16" fill="white" />
            <rect x="80" y="30" width="160" height="140" rx="16" stroke="#BFDBFE" strokeWidth="2" />
            {/* Person silhouette */}
            <circle cx="160" cy="90" r="30" fill="#BFDBFE" />
            <ellipse cx="160" cy="145" rx="42" ry="25" fill="#BFDBFE" />
            {/* Face */}
            <circle cx="152" cy="88" r="4" fill="#2563EB" />
            <circle cx="168" cy="88" r="4" fill="#2563EB" />
            <path d="M153 100 Q160 106 167 100" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Guide lines */}
            <rect x="100" y="50" width="120" height="100" rx="4" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
            {/* Camera icon */}
            <rect x="224" y="184" width="72" height="44" rx="12" fill="#2563EB" />
            <circle cx="260" cy="206" r="10" fill="white" opacity="0.9" />
            <circle cx="260" cy="206" r="6" fill="#2563EB" />
            <rect x="248" y="188" width="16" height="6" rx="3" fill="white" opacity="0.7" />
            {/* Grid of mini photos */}
            <rect x="20" y="184" width="72" height="44" rx="12" fill="white" />
            <rect x="20" y="184" width="72" height="44" rx="12" stroke="#E2E8F0" strokeWidth="1.5" />
            <rect x="28" y="192" width="24" height="28" rx="4" fill="#BFDBFE" />
            <rect x="56" y="192" width="24" height="28" rx="4" fill="#BFDBFE" opacity="0.6" />
            {/* Checkmark badge */}
            <circle cx="160" cy="200" r="16" fill="#22C55E" />
            <path d="M153 200 L158 205 L167 196" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold text-[#0F172A] leading-tight">
            Tap. Smile.<br />Print.
          </h1>
          <p className="text-base text-[#64748B] leading-relaxed">
            {isPhotoBooth ? (
              <>
                Take three fun photos<br />and print them on A5.
              </>
            ) : (
              <>
                We will help you make<br />your ID photo.
              </>
            )}
          </p>
        </div>

        <Btn size="lg" onClick={onStart} className="w-full max-w-xs">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="white" strokeWidth="1.5" />
            <path d="M8 7L13 10L8 13" fill="white" />
          </svg>
          Start
        </Btn>
      </div>

      {/* Feature chips */}
      <div className="w-full max-w-lg mx-auto px-6 pb-8 flex gap-3">
        <FeatureChip icon="fast" label={isPhotoBooth ? "3 Photos" : "Take Photo"} />
        <FeatureChip icon="quality" label={isPhotoBooth ? "A5 Sheet" : "Pick Style"} />
        <FeatureChip icon="print" label="Print" />
      </div>
    </Screen>
  );
}
