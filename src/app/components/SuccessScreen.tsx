import { Screen, Btn } from "./ui";
import { motion } from "motion/react";

interface Props {
  appMode?: "id-photo" | "photo-booth";
  onPrintAnother: () => void;
  onNewSession: () => void;
}

export function SuccessScreen({ appMode = "id-photo", onPrintAnother, onNewSession }: Props) {
  const itemLabel = appMode === "photo-booth" ? "Photo Booth Sheet" : "ID Photo";

  return (
    <Screen className="items-center justify-center">
      <div className="flex flex-col items-center gap-8 px-6 max-w-sm mx-auto text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="w-32 h-32 rounded-full bg-[#22C55E] flex items-center justify-center shadow-2xl shadow-green-200"
        >
          <motion.svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <motion.path
              d="M12 28L24 40L44 18"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            />
          </motion.svg>
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

        {/* QR code card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Download Your Digital Copy</p>
          <div className="flex items-center gap-4">
            {/* QR placeholder */}
            <div className="w-20 h-20 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex-shrink-0 overflow-hidden">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                {/* Simplified QR pattern */}
                {[
                  [2,2,6,6], [10,2,6,6], [18,2,6,6], [26,2,6,6], [34,2,6,6],
                  [2,10,6,6], [34,10,6,6],
                  [2,18,6,6], [10,18,6,6], [18,18,6,6], [34,18,6,6],
                  [2,26,6,6], [18,26,6,6], [26,26,6,6], [34,26,6,6],
                  [2,34,6,6], [10,34,6,6], [18,34,6,6], [26,34,6,6], [34,34,6,6],
                  [42,2,6,6], [50,2,6,6], [66,2,6,6], [74,2,6,6],
                  [42,10,6,6], [58,10,6,6], [74,10,6,6],
                  [50,18,6,6], [58,18,6,6], [74,18,6,6],
                  [42,26,6,6], [50,26,6,6], [66,26,6,6],
                  [42,34,6,6], [58,34,6,6], [66,34,6,6], [74,34,6,6],
                  [2,42,6,6], [10,42,6,6], [26,42,6,6], [34,42,6,6],
                  [2,50,6,6], [10,50,6,6], [18,50,6,6], [26,50,6,6],
                  [2,58,6,6], [26,58,6,6], [34,58,6,6],
                  [2,66,6,6], [10,66,6,6], [18,66,6,6], [26,66,6,6], [34,66,6,6],
                  [42,42,6,6], [58,42,6,6], [66,42,6,6], [74,42,6,6],
                  [42,50,6,6], [50,50,6,6], [74,50,6,6],
                  [50,58,6,6], [58,58,6,6], [66,58,6,6],
                  [42,66,6,6], [58,66,6,6], [66,66,6,6], [74,66,6,6],
                ].map(([x, y, w, h], idx) => (
                  <rect key={idx} x={x} y={y} width={w} height={h} fill="#0F172A" />
                ))}
                <rect x="2" y="2" width="22" height="22" rx="2" fill="none" stroke="#0F172A" strokeWidth="2" />
                <rect x="6" y="6" width="14" height="14" rx="1" fill="#0F172A" />
                <rect x="56" y="2" width="22" height="22" rx="2" fill="none" stroke="#0F172A" strokeWidth="2" />
                <rect x="60" y="6" width="14" height="14" rx="1" fill="#0F172A" />
                <rect x="2" y="56" width="22" height="22" rx="2" fill="none" stroke="#0F172A" strokeWidth="2" />
                <rect x="6" y="60" width="14" height="14" rx="1" fill="#0F172A" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-[#64748B]">Scan to download your photo to your phone</p>
              <p className="text-xs font-semibold text-[#2563EB]">Available for 24 hours</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 w-full"
        >
          <Btn onClick={onPrintAnother} variant="secondary" fullWidth>
            Print Another Copy
          </Btn>
          <p className="text-xs text-[#64748B]">
            This returns to the same print preview so you can print the current sheet again.
          </p>
          <Btn onClick={onNewSession} fullWidth>
            Start New Session
          </Btn>
        </motion.div>
      </div>
    </Screen>
  );
}
