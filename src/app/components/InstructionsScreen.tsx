import { Screen, Btn, NavHeader } from "./ui";

interface Props {
  onBack: () => void;
  onContinue: () => void;
}

const tips = [
  { emoji: "👁️", title: "Look straight at camera", desc: "Keep your gaze directly forward" },
  { emoji: "🎯", title: "Keep face centered", desc: "Position your face in the guide circle" },
  { emoji: "😐", title: "Neutral expression", desc: "Relax your face, mouth gently closed" },
  { emoji: "🧢", title: "Remove hats & glasses", desc: "No sunglasses, caps, or headwear" },
];

export function InstructionsScreen({ onBack, onContinue }: Props) {
  return (
    <Screen>
      <NavHeader onBack={onBack} title="Photo Tips" step={1} totalSteps={7} />

      <div className="flex-1 flex flex-col items-center px-6 py-8 gap-8 max-w-lg mx-auto w-full">
        {/* Illustration */}
        <div className="w-full max-w-xs mx-auto">
          <svg viewBox="0 0 280 200" fill="none" className="w-full">
            <rect width="280" height="200" rx="20" fill="#EFF6FF" />
            {/* Camera frame */}
            <rect x="60" y="20" width="160" height="140" rx="12" fill="white" stroke="#BFDBFE" strokeWidth="2" />
            {/* Guide oval */}
            <ellipse cx="140" cy="90" rx="50" ry="60" stroke="#2563EB" strokeWidth="2" strokeDasharray="8 4" fill="none" />
            {/* Corner guides */}
            {[
              [80, 40], [80, 40],
            ].map(() => null)}
            <path d="M80 56 L80 44 L92 44" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M200 56 L200 44 L188 44" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M80 124 L80 136 L92 136" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M200 124 L200 136 L188 136" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Person */}
            <circle cx="140" cy="78" r="24" fill="#BFDBFE" />
            <ellipse cx="140" cy="128" rx="34" ry="20" fill="#BFDBFE" />
            <circle cx="133" cy="76" r="3.5" fill="#1E40AF" />
            <circle cx="147" cy="76" r="3.5" fill="#1E40AF" />
            <path d="M134 87 Q140 92 146 87" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Arrows */}
            <path d="M24 90 L50 90 M44 84 L50 90 L44 96" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M256 90 L230 90 M236 84 L230 90 L236 96" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Light indicator */}
            <circle cx="140" cy="174" r="8" fill="#22C55E" opacity="0.8" />
            <text x="140" y="178" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✓</text>
          </svg>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <h2 className="text-xl font-bold text-[#0F172A] text-center">Before You Start</h2>
          <div className="flex flex-col gap-3">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-4 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{tip.emoji}</span>
                <div>
                  <p className="font-semibold text-[#0F172A] text-sm">{tip.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 w-full mt-auto">
          <Btn variant="secondary" onClick={onBack} className="flex-1">
            Back
          </Btn>
          <Btn onClick={onContinue} className="flex-1">
            Continue
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
