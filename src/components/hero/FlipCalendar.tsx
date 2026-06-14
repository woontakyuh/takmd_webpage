import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

interface Props {
  style: React.CSSProperties;
}

export default function FlipCalendar({ style }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = MONTHS[now.getMonth()];
  const day = now.getDate();
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());

  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={style}
    >
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a]/90 rounded-sm font-mono text-white">
        <div
          className="text-white/60 tracking-widest"
          style={{ fontSize: "clamp(5px, 0.9vw, 12px)" }}
        >
          {year}
        </div>
        <div className="flex items-baseline gap-[0.3em]">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={month}
              className="font-bold tracking-wide"
              style={{ fontSize: "clamp(7px, 1.4vw, 18px)" }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {month}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={day}
              className="font-bold"
              style={{ fontSize: "clamp(10px, 2.2vw, 28px)" }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {day}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-[0.15em]">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`${hours}:${minutes}`}
              className="text-white/70 tracking-widest"
              style={{ fontSize: "clamp(5px, 1vw, 13px)" }}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {hours}:{minutes}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
