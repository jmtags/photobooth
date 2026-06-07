import { Screen, Btn, NavHeader } from "./ui";
import { RefreshCw, Check } from "lucide-react";

interface Props {
  photoUrl: string;
  onRetake: () => void;
  onAccept: () => void;
}

export function PhotoReviewScreen({ photoUrl, onRetake, onAccept }: Props) {
  return (
    <Screen>
      <NavHeader onBack={onRetake} title="Review Photo" step={3} totalSteps={7} />

      <div className="flex-1 flex flex-col items-center px-6 py-8 gap-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-bold text-[#0F172A]">How does this look?</h2>
          <p className="text-sm text-[#64748B]">Make sure your face is clear and well-lit</p>
        </div>

        {/* Photo preview */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white w-64 h-80 mx-auto flex-shrink-0">
          <img
            src={photoUrl}
            alt="Captured photo preview"
            className="w-full h-full object-cover"
          />
          {/* Watermark overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 bg-[#22C55E] text-white text-xs px-2 py-1 rounded-lg font-semibold">
              Preview
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Check before continuing:</p>
          {[
            "Face is clearly visible",
            "Good lighting, no shadows",
            "Neutral background",
            "Eyes open and looking forward",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 py-2 border-b border-[#F8FAFC] last:border-0">
              <div className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                <Check size={11} color="white" strokeWidth={3} />
              </div>
              <span className="text-sm text-[#0F172A]">{item}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full mt-auto">
          <Btn variant="secondary" onClick={onRetake} className="flex-1">
            <RefreshCw size={16} />
            Retake
          </Btn>
          <Btn onClick={onAccept} className="flex-1">
            <Check size={16} />
            Use This Photo
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
