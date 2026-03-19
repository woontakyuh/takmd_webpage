import { motion } from "framer-motion";
import type { Marker } from "./types";

interface DotMarkerProps {
  marker: Marker;
  isHovered: boolean;
  isLocked: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  index: number;
  isMobile: boolean;
}

export function DotMarker({
  marker,
  isHovered,
  isLocked,
  onHover,
  onLeave,
  onClick,
  index,
  isMobile,
}: DotMarkerProps) {
  const active = isHovered || isLocked;
  const idleDotSize = isMobile ? 12 : 9;
  const activeDotSize = isMobile ? 16 : 14;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 flex items-center justify-center"
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        width: 56,
        height: 56,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          width: active ? 40 : 22,
          height: active ? 40 : 22,
          opacity: active ? 0.4 : 0.15,
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle, rgba(${marker.rgb},0.6) 0%, transparent 70%)`,
        }}
      />

      {/* Dot */}
      <motion.div
        className="relative rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          width: active ? activeDotSize : idleDotSize,
          height: active ? activeDotSize : idleDotSize,
          boxShadow: active
            ? `0 0 12px rgba(${marker.rgb},0.9), 0 0 28px rgba(${marker.rgb},0.4)`
            : `0 0 8px rgba(${marker.rgb},0.6)`,
        }}
        transition={{
          duration: 0.3,
          scale: { delay: 0.4 + index * 0.08, duration: 0.5, type: "spring", stiffness: 200 },
          opacity: { delay: 0.4 + index * 0.08, duration: 0.3 },
        }}
        style={{ backgroundColor: marker.color }}
      />

      {/* Pulse ring — plays once on mount to draw attention */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: `1.5px solid ${marker.color}` }}
        initial={{ width: idleDotSize, height: idleDotSize, opacity: 0.7 }}
        animate={{ width: 44, height: 44, opacity: 0 }}
        transition={{
          delay: 1.2 + index * 0.15,
          duration: 1.0,
          ease: "easeOut",
        }}
      />

      {/* Label */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono font-medium pointer-events-none"
        style={{
          bottom: "100%",
          marginBottom: 8,
          color: marker.color,
          fontSize: isMobile ? "13px" : "min(1.5vw, 14px)",
          textShadow: `0 0 12px rgba(${marker.rgb},0.7), 0 1px 4px rgba(0,0,0,0.5)`,
          letterSpacing: "0.03em",
        }}
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
        transition={{ duration: 0.2 }}
      >
        {marker.label}
      </motion.div>
    </div>
  );
}
