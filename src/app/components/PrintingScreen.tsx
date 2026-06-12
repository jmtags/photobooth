import { useEffect, useState } from "react";
import { Screen, ProgressBar } from "./ui";
import { motion } from "motion/react";
import { Printer, Sparkles } from "lucide-react";

interface Props {
  appMode?: "id-photo" | "photo-booth";
  onDone: () => void;
}

const steps = [
  { label: "Composing sheet", duration: 850 },
  { label: "Preparing print", duration: 950 },
  { label: "Finishing session", duration: 1050 },
];

export function PrintingScreen({ appMode = "id-photo", onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isPhotoBooth = appMode === "photo-booth";

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
    <Screen className="items-center justify-center bg-[#F8FAFC]">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 140 }}
          className="relative flex h-36 w-36 items-center justify-center rounded-[28px] bg-white shadow-2xl shadow-blue-100 ring-1 ring-[#DBEAFE]"
        >
          <motion.div
            className="absolute inset-4 rounded-[22px] border border-[#DBEAFE]"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {isPhotoBooth ? (
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 4 }, (_, index) => (
                <motion.div
                  key={index}
                  className="h-9 w-9 rounded-md bg-[#EFF6FF] ring-1 ring-[#BFDBFE]"
                  animate={{ y: [0, -3, 0], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.12 }}
                />
              ))}
            </div>
          ) : (
            <Printer size={54} className="text-[#2563EB]" strokeWidth={1.8} />
          )}
          <motion.div
            className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-200"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={18} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            {isPhotoBooth ? "Finishing Your Booth Print" : "Finishing Your Print"}
          </h2>
          <p className="text-sm leading-relaxed text-[#64748B]">
            {isPhotoBooth
              ? "Your four-photo sheet is being prepared for a clean A5 print."
              : "Your photo sheet is being prepared for printing."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[#2563EB]">{steps[stepIndex]?.label}</span>
            <span className="text-sm font-semibold text-[#64748B]">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} />

          <div className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((step, i) => (
              <div
                key={step.label}
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  i <= stepIndex ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                }`}
              />
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xs font-medium uppercase tracking-[0.18em] text-[#94A3B8]"
        >
          Please keep this screen open
        </motion.p>
      </div>
    </Screen>
  );
}
