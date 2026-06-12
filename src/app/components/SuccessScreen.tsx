import { Screen, Btn } from "./ui";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

interface Props {
  appMode?: "id-photo" | "photo-booth";
  onNewSession: () => void;
}

export function SuccessScreen({ appMode = "id-photo", onNewSession }: Props) {
  const itemLabel = appMode === "photo-booth" ? "Photo Booth Sheet" : "ID Photo";

  return (
    <Screen className="items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 180 }}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl shadow-emerald-100 ring-1 ring-emerald-100"
        >
          <CheckCircle2 size={68} className="text-[#22C55E]" strokeWidth={1.8} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-3xl font-extrabold text-[#0F172A]">Your {itemLabel} Is Ready!</h1>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Your print has been sent to the printer. Please collect it from the print tray.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 text-left shadow-sm"
        >
          <p className="text-sm font-bold text-[#0F172A]">Session complete</p>
          <p className="mt-1 text-sm leading-relaxed text-[#64748B]">
            The current photos are kept only for this session and will be cleared when you start again.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 w-full"
        >
          <Btn onClick={onNewSession} fullWidth>
            Start New Session
          </Btn>
        </motion.div>
      </div>
    </Screen>
  );
}
