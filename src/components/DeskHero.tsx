import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HotspotId } from "./desk-hero/types";
import { MARKERS, MONITOR } from "../data/terminal-pages";
import { DotMarker } from "./desk-hero/DotMarker";
import { TerminalView } from "./desk-hero/TerminalView";

// ─── Main ────────────────────────────────────────────────────────

export default function DeskHero() {
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  const [locked, setLocked] = useState<HotspotId | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewOverride, setViewOverride] = useState<"desktop" | "mobile" | null>(null);
  const [imageDims, setImageDims] = useState({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const activeSpot = locked ?? hovered;

  // URL param override: ?view=desktop or ?view=mobile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "desktop" || view === "mobile") setViewOverride(view);
  }, []);

  const effectiveMobile = viewOverride
    ? viewOverride === "mobile"
    : isMobile;

  const updateDims = useCallback(() => {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const cW = c.clientWidth;
    const cH = c.clientHeight;
    const nW = img.naturalWidth || 1024;
    const nH = img.naturalHeight || 680;
    const iA = nW / nH;
    const cA = cW / cH;
    let rW: number, rH: number;
    if (cA > iA) {
      rH = cH;
      rW = cH * iA;
    } else {
      rW = cW;
      rH = cW / iA;
    }
    setImageDims({
      width: rW,
      height: rH,
      offsetX: (cW - rW) / 2,
      offsetY: (cH - rH) / 2,
    });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    updateDims();
    const handler = () => {
      checkMobile();
      updateDims();
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [updateDims]);

  const handleClick = (id: HotspotId) =>
    setLocked((prev) => (prev === id ? null : id));

  const handleBgClick = () => {
    if (locked) setLocked(null);
  };

  // Accent color for active spot
  const activeMarker = activeSpot
    ? MARKERS.find((m) => m.id === activeSpot)
    : null;
  const accentColor = activeMarker?.color ?? "#4ade80";
  const accentRgb = activeMarker?.rgb ?? "74,222,128";
  const welcomeColor = "#4ade80";
  const welcomeRgb = "74,222,128";

  // ─── Mobile layout ──────────────────────────────────────────────
  if (effectiveMobile) {
    return (
      <div
        className="flex flex-col min-h-screen bg-[#0a0a0a] select-none"
        onClick={handleBgClick}
      >
        <div
          ref={containerRef}
          className="relative w-full shrink-0"
          style={{ aspectRatio: "1024 / 680" }}
        >
          <picture>
            <source srcSet="/desk-setup.webp" type="image/webp" />
            <img
              ref={imgRef}
              src="/desk-setup.png"
              alt="Desk setup with monitor, keyboard, and accessories"
              className="absolute inset-0 w-full h-full object-contain"
              onLoad={updateDims}
              draggable={false}
            />
          </picture>
          {imageDims.width > 0 && (
            <div
              className="absolute"
              style={{
                left: imageDims.offsetX,
                top: imageDims.offsetY,
                width: imageDims.width,
                height: imageDims.height,
              }}
            >
              {MARKERS.map((m, i) => (
                <DotMarker
                  key={m.id}
                  marker={m}
                  isHovered={false}
                  isLocked={locked === m.id}
                  onHover={() => {}}
                  onLeave={() => {}}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleClick(m.id);
                  }}
                  index={i}
                  isMobile
                />
              ))}
            </div>
          )}
          <motion.div
            className="absolute z-30 pointer-events-none"
            style={{ left: "5%", top: "6%" }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: locked ? 0.25 : 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="font-sans text-white text-sm font-semibold tracking-wide" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
              Woon Tak Yuh, MD
            </div>
            <div className="font-mono text-white/70 text-[10px] mt-0.5 tracking-wider" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              Endoscopic Spine Surgeon & Educator · AI Researcher
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {locked && (
            <motion.div
              key={`mobile-term-${locked}`}
              className="flex-1 min-h-[50vh] bg-black/95"
              style={{ borderTop: `1px solid rgba(${accentRgb},0.2)` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <TerminalView
                rootPageKey={locked}
                onClose={() => { setLocked(null); setHovered(null); }}
                mobile
                accentColor={accentColor}
                accentRgb={accentRgb}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!locked && (
          <div className="py-4 text-center font-mono text-[10px] text-white/25">
            tap the dots to explore
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop layout (in-monitor terminal) ──────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden select-none"
      onClick={handleBgClick}
    >
      <picture>
        <source srcSet="/desk-setup.webp" type="image/webp" />
        <img
          ref={imgRef}
          src="/desk-setup.png"
          alt="Desk setup with monitor, keyboard, and accessories"
          className="absolute"
          style={{
            left: imageDims.offsetX,
            top: imageDims.offsetY,
            width: imageDims.width,
            height: imageDims.height,
          }}
          onLoad={updateDims}
          draggable={false}
        />
      </picture>

      {imageDims.width > 0 && (
        <div
          className="absolute"
          style={{
            left: imageDims.offsetX,
            top: imageDims.offsetY,
            width: imageDims.width,
            height: imageDims.height,
          }}
        >
          {MARKERS.map((m, i) => (
            <DotMarker
              key={m.id}
              marker={m}
              isHovered={hovered === m.id}
              isLocked={locked === m.id}
              onHover={() => { if (!locked) setHovered(m.id); }}
              onLeave={() => { if (!locked) setHovered(null); }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleClick(m.id);
              }}
              index={i}
              isMobile={false}
            />
          ))}

          {/* Monitor screen — shows welcome or active content */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: `${MONITOR.x}%`,
              top: `${MONITOR.y}%`,
              width: `${MONITOR.w}%`,
              height: `${MONITOR.h}%`,
              borderRadius: "0.6%",
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {activeSpot && (
                <motion.div
                  key={activeSpot}
                  className="absolute inset-0 bg-black/92"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TerminalView
                    rootPageKey={activeSpot}
                    onClose={() => { setLocked(null); setHovered(null); }}
                    accentColor={accentColor}
                    accentRgb={accentRgb}
                  />
                </motion.div>
              )}
              {!activeSpot && (
                <motion.div
                  key="welcome"
                  className="absolute inset-0 bg-black/85"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <TerminalView
                    rootPageKey="__welcome__"
                    onClose={() => {}}
                    accentColor={welcomeColor}
                    accentRgb={welcomeRgb}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Name overlay — top-left of image */}
          <motion.div
            className="absolute z-30 pointer-events-none"
            style={{ left: "4%", top: "6%" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: activeSpot ? 0.3 : 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div
              className="font-sans text-white font-semibold tracking-wide"
              style={{ fontSize: "min(2vw, 20px)", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
            >
              Woon Tak Yuh, MD
            </div>
            <div
              className="font-mono text-white/70 mt-1 tracking-wider"
              style={{ fontSize: "min(1.2vw, 12px)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              Endoscopic Spine Surgeon & Educator · AI Researcher
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom hint */}
      <AnimatePresence>
        {!locked && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 font-mono text-white/40 pointer-events-none"
            style={{ fontSize: "min(1vw, 11px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5 }}
          >
            hover or click the dots to explore
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-left branding */}
      <button
        onClick={() => { setLocked(null); setHovered(null); }}
        className="fixed top-5 left-6 font-mono text-xs text-white/40 tracking-wider hover:text-white/70 transition-colors cursor-pointer z-50"
      >
        WTY.md
      </button>
    </div>
  );
}
