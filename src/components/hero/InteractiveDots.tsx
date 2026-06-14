import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TerminalOverlay from "./TerminalOverlay";
import FlipCalendar from "./FlipCalendar";
import JournalCover from "./JournalCover";

// ─── Image dimensions (natural) ──────────────────────────────────
const IMG_W = 2816;
const IMG_H = 1536;
const IMG_ASPECT = IMG_W / IMG_H;

// ─── Dot definitions ─────────────────────────────────────────────
interface DotConfig {
  id: string;
  label: string;
  description: string;
  link: string;
  x: number;
  y: number;
}

const DOTS: DotConfig[] = [
  { id: "ube",       label: "UBE Surgery",            description: "Anchor-based endoscopic spine decompression",   link: "/ube",       x: 64,   y: 40   },
  { id: "ai",        label: "AI in Clinical Practice", description: "Workflow augmentation & decision support",      link: "/ai",        x: 50,   y: 24   },
  { id: "research",  label: "Research & Publications", description: "29 publications, h-index 11",                   link: "/research",  x: 77,   y: 70   },
  { id: "education", label: "Upcoming Programs",       description: "Global surgical education calendar",            link: "/education", x: 19,   y: 51   },
  { id: "knowledge", label: "Knowledge Base",          description: "Clinical notes & structured insights",          link: "/knowledge", x: 46,   y: 70   },
  { id: "media",     label: "Media",                   description: "Talks, vlogs, and reviews",                     link: "/media",     x: 82,   y: 42   },
];

// ─── Overlay regions (image %) ───────────────────────────────────
const MONITOR  = { left: 19,   top: 4.5,  width: 62,   height: 38.5 };
const CALENDAR = { left: 12.5, top: 44,   width: 13.5, height: 14   };
const JOURNAL  = { left: 69,   top: 57,   width: 17,   height: 30   };

// ─── Hook: track object-cover image dims ─────────────────────────
function useImageCover() {
  const [dims, setDims] = useState({ imgW: 0, imgH: 0, offsetX: 0, offsetY: 0 });

  const update = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vpAspect = vw / vh;
    let imgW: number, imgH: number, offsetX: number, offsetY: number;

    if (vpAspect > IMG_ASPECT) {
      imgW = vw;
      imgH = vw / IMG_ASPECT;
      offsetX = 0;
      offsetY = (vh - imgH) / 2;
    } else {
      imgH = vh;
      imgW = vh * IMG_ASPECT;
      offsetX = (vw - imgW) / 2;
      offsetY = 0;
    }
    setDims({ imgW, imgH, offsetX, offsetY });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const toStyle = useCallback(
    (leftPct: number, topPct: number, widthPct: number, heightPct: number): React.CSSProperties => ({
      left: dims.offsetX + (leftPct / 100) * dims.imgW,
      top:  dims.offsetY + (topPct / 100)  * dims.imgH,
      width:  (widthPct / 100)  * dims.imgW,
      height: (heightPct / 100) * dims.imgH,
    }),
    [dims],
  );

  const toPos = useCallback(
    (xPct: number, yPct: number) => ({
      x: dims.offsetX + (xPct / 100) * dims.imgW,
      y: dims.offsetY + (yPct / 100) * dims.imgH,
    }),
    [dims],
  );

  return { ...dims, toStyle, toPos, ready: dims.imgW > 0 };
}

// ─── Dot component ───────────────────────────────────────────────
function Dot({
  dot,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
  pos,
  index,
}: {
  dot: DotConfig;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  pos: { x: number; y: number };
  index: number;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 flex items-center justify-center"
      style={{
        left: pos.x,
        top: pos.y,
        width: 48,
        height: 48,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <motion.div
        className="absolute rounded-full border border-white/20"
        animate={{
          width: isActive ? 28 : 20,
          height: isActive ? 28 : 20,
          borderColor: isActive ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
        }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute rounded-full"
        animate={{
          width: isActive ? 36 : 22,
          height: isActive ? 36 : 22,
          opacity: isActive ? 0.3 : 0.1,
        }}
        transition={{ duration: 0.25 }}
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
        }}
      />
      <motion.div
        className="relative rounded-full bg-white"
        animate={{
          width: isActive ? 14 : 10,
          height: isActive ? 14 : 10,
          opacity: isActive ? 1 : 0.7,
          boxShadow: isActive
            ? "0 0 14px rgba(255,255,255,0.6), 0 0 28px rgba(255,255,255,0.3)"
            : "0 0 8px rgba(255,255,255,0.3)",
          scale: isActive ? 1 : [1, 1.3, 1],
        }}
        transition={
          isActive
            ? { duration: 0.25 }
            : {
                scale: { duration: 2, repeat: Infinity, delay: index * 0.35 },
                default: { duration: 0.25 },
              }
        }
      />
    </div>
  );
}

// ─── Card popup ──────────────────────────────────────────────────
function CardPopup({
  dot,
  pos,
  onClose,
}: {
  dot: DotConfig;
  pos: { x: number; y: number };
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjust, setAdjust] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let ax = 0;
    let ay = 0;
    if (rect.right > vw - 16) ax = vw - 16 - rect.right;
    if (rect.left < 16) ax = 16 - rect.left;
    if (rect.top < 16) ay = 16 - rect.top;
    if (rect.bottom > vh - 16) ay = vh - 16 - rect.bottom;
    setAdjust({ x: ax, y: ay });
  }, [pos]);

  return (
    <motion.div
      ref={cardRef}
      className="absolute z-50 pointer-events-auto"
      style={{
        left: pos.x + adjust.x,
        top: pos.y - 16 + adjust.y,
        transform: "translate(-50%, -100%)",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 max-w-[240px] min-w-[180px]">
        <h3 className="text-white font-bold text-sm mb-1">{dot.label}</h3>
        <p className="text-white/60 text-xs leading-relaxed mb-3">
          {dot.description}
        </p>
        <a
          href={dot.link}
          className="text-white/90 text-xs font-medium hover:text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Explore &rarr;
        </a>
      </div>
    </motion.div>
  );
}

// ─── Mobile bottom card ──────────────────────────────────────────
function MobileCard({
  dot,
  onClose,
}: {
  dot: DotConfig;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
    >
      <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-5 pb-8 rounded-t-2xl">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <h3 className="text-white font-bold text-lg mb-1">{dot.label}</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          {dot.description}
        </p>
        <a
          href={dot.link}
          className="inline-block bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Explore &rarr;
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function InteractiveDots() {
  const { toStyle, toPos, ready } = useImageCover();
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleDotClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActive((prev) => (prev === id ? null : id));
  };

  const handleBgClick = () => {
    if (active) setActive(null);
  };

  const activeDot = active ?? hovered;
  const activeDotConfig = DOTS.find((d) => d.id === activeDot);

  if (!ready) return null;

  return (
    <div className="absolute inset-0 z-10" onClick={handleBgClick}>
      <TerminalOverlay style={toStyle(MONITOR.left, MONITOR.top, MONITOR.width, MONITOR.height)} />
      <FlipCalendar style={toStyle(CALENDAR.left, CALENDAR.top, CALENDAR.width, CALENDAR.height)} />
      <JournalCover style={toStyle(JOURNAL.left, JOURNAL.top, JOURNAL.width, JOURNAL.height)} />

      {DOTS.map((dot, i) => (
        <Dot
          key={dot.id}
          dot={dot}
          index={i}
          isActive={activeDot === dot.id}
          pos={toPos(dot.x, dot.y)}
          onMouseEnter={() => {
            if (!active && !isMobile) setHovered(dot.id);
          }}
          onMouseLeave={() => {
            if (!active && !isMobile) setHovered(null);
          }}
          onClick={(e) => handleDotClick(dot.id, e)}
        />
      ))}

      {!isMobile && (
        <AnimatePresence>
          {activeDotConfig && activeDot && (
            <CardPopup
              key={activeDot}
              dot={activeDotConfig}
              pos={toPos(activeDotConfig.x, activeDotConfig.y)}
              onClose={() => {
                setActive(null);
                setHovered(null);
              }}
            />
          )}
        </AnimatePresence>
      )}

      {isMobile && (
        <AnimatePresence>
          {active && activeDotConfig && (
            <MobileCard
              key={active}
              dot={activeDotConfig}
              onClose={() => setActive(null)}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
