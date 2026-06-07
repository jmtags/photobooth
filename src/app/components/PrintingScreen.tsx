import { useEffect, useState } from "react";
import { Screen, ProgressBar } from "./ui";
import { motion } from "motion/react";

interface Props {
  onDone: () => void;
}

const steps = [
  { label: "Removing Background", duration: 1800 },
  { label: "Applying Attire", duration: 1600 },
  { label: "Generating Layout", duration: 1400 },
  { label: "Sending To Printer", duration: 1200 },
];

export function PrintingScreen({ onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const advance = () => {
      if (current >= steps.length) {
        onDone();
        return;
      }
      setStepIndex(current);
      const targetProgress = ((current + 1) / steps.length) * 100;
      const duration = steps[current].duration;
      const start = Date.now();
      const startProgress = (current / steps.length) * 100;

      const tick = () => {
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / duration);
        setProgress(startProgress + (targetProgress - startProgress) * t);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          current += 1;
          setTimeout(advance, 200);
        }
      };
      requestAnimationFrame(tick);
    };
    advance();
  }, [onDone]);

  return (
    <Screen className="items-center justify-center">
      <div className="flex flex-col items-center gap-8 px-6 max-w-sm mx-auto text-center">
        {/* Animated printer icon */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 rounded-3xl bg-[#2563EB] flex items-center justify-center shadow-2xl shadow-blue-200"
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="8" y="18" width="44" height="26" rx="6" fill="white" opacity="0.9" />
            <rect x="14" y="8" width="32" height="14" rx="3" fill="white" opacity="0.7" />
            <rect x="14" y="34" width="32" height="18" rx="3" fill="white" />
            <rect x="20" y="40" width="20" height="2" rx="1" fill="#2563EB" />
            <rect x="20" y="45" width="14" height="2" rx="1" fill="#2563EB" opacity="0.5" />
            <circle cx="44" cy="28" r="3" fill="#22C55E" />
            {/* Paper coming out */}
            <motion.rect
              x="20" y="30" width="20" height="10" rx="1" fill="#EFF6FF"
              animate={{ y: [30, 38, 30] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-[#0F172A]">Preparing Your Print</h2>
          <p className="text-[#64748B] text-sm">Please wait while we process your photo</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <ProgressBar value={progress} />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#2563EB]">{steps[stepIndex]?.label}</span>
            <span className="text-sm text-[#64748B]">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Step list */}
        <div className="w-full flex flex-col gap-2">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center gap-3 py-2 px-4 rounded-xl transition-all duration-300 ${
                i < stepIndex
                  ? "bg-green-50"
                  : i === stepIndex
                  ? "bg-blue-50"
                  : "bg-[#F8FAFC]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                  i < stepIndex
                    ? "bg-[#22C55E] text-white"
                    : i === stepIndex
                    ? "bg-[#2563EB] text-white"
                    : "bg-[#E2E8F0] text-[#94A3B8]"
                }`}
              >
                {i < stepIndex ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-semibold ${
                  i < stepIndex
                    ? "text-[#22C55E]"
                    : i === stepIndex
                    ? "text-[#2563EB]"
                    : "text-[#94A3B8]"
                }`}
              >
                {step.label}
              </span>
              {i === stepIndex && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-auto w-2 h-2 rounded-full bg-[#2563EB]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
