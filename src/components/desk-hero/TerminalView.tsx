import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { HotspotId } from "./types";
import { PAGES } from "../../data/terminal-pages";

function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [len, setLen] = useState(0);

  useEffect(() => {
    setLen(0);
  }, [text]);

  useEffect(() => {
    if (len >= text.length) return;
    const t = setTimeout(() => setLen((l) => l + 1), speed);
    return () => clearTimeout(t);
  }, [len, text, speed]);

  return <>{text.slice(0, len)}</>;
}

interface TerminalViewProps {
  rootPageKey: HotspotId | "__welcome__";
  onClose: () => void;
  mobile?: boolean;
  accentColor?: string;
  accentRgb?: string;
}

export function TerminalView({
  rootPageKey,
  onClose,
  mobile = false,
  accentColor = "#4ade80",
  accentRgb = "74,222,128",
}: TerminalViewProps) {
  const [pageStack, setPageStack] = useState<string[]>([rootPageKey]);
  const [typingDone, setTypingDone] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const pageKey = pageStack[pageStack.length - 1];
  const page = PAGES[pageKey];
  const allText = page.lines.join("\n");

  useEffect(() => {
    setBodyText("");
    setTypingDone(false);
  }, [pageKey]);

  useEffect(() => {
    setPageStack([rootPageKey]);
  }, [rootPageKey]);

  useEffect(() => {
    if (bodyText.length >= allText.length) {
      setTypingDone(true);
      return;
    }
    const t = setTimeout(
      () => setBodyText(allText.slice(0, bodyText.length + 1)),
      10,
    );
    return () => clearTimeout(t);
  }, [bodyText, allText]);

  const goBack = () => {
    if (pageStack.length > 1) setPageStack((s) => s.slice(0, -1));
    else onClose();
  };

  const goSub = (subKey: string) => setPageStack((s) => [...s, subKey]);

  // Derive color variants from accent
  const dimColor = `rgba(${accentRgb},0.5)`;
  const subtleColor = `rgba(${accentRgb},0.3)`;
  const scanlineColor = `rgba(${accentRgb},0.03)`;

  return (
    <div className="w-full h-full flex flex-col font-mono overflow-hidden relative" style={{ color: accentColor }}>
      {/* CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `repeating-linear-gradient(0deg,transparent,transparent 2px,${scanlineColor} 2px,${scanlineColor} 4px)`,
        }}
      />

      {/* Top bar */}
      <div className={`shrink-0 flex items-center justify-between z-20 ${mobile ? "px-4 pt-3 pb-1" : "px-[6%] pt-[5%] pb-[2%]"}`}>
        <button
          onClick={goBack}
          className={`${mobile ? "text-xs" : "text-[min(1.2vw,11px)]"} transition-colors pointer-events-auto cursor-pointer`}
          style={{ color: dimColor }}
          onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = dimColor; }}
        >
          {pageStack.length > 1 ? "\u2190 back" : "\u2715 close"}
        </button>
        <span
          className={`${mobile ? "text-[10px]" : "text-[min(1vw,10px)]"}`}
          style={{ color: subtleColor }}
        >
          {pageStack.join(" / ")}
        </span>
      </div>

      {/* Command line */}
      <div className={`shrink-0 leading-relaxed z-20 ${mobile ? "px-4 text-sm" : "px-[6%] text-[min(1.3vw,13px)]"}`}>
        <span style={{ color: dimColor }}>~</span>
        <span style={{ color: subtleColor }}> $ </span>
        <TypewriterText text={page.command} speed={25} />
      </div>

      {/* Body */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden z-20 scrollbar-hide ${mobile ? "px-4 pb-4" : "px-[6%] pb-[4%]"}`}>
        <pre
          className={`${mobile ? "text-[13px] leading-[1.8]" : "text-[min(1.15vw,11.5px)] leading-[1.7]"} whitespace-pre-wrap break-words`}
          style={{ color: `rgba(${accentRgb},0.85)` }}
        >
          {bodyText}
          {!typingDone && (
            <span
              className="inline-block w-[0.5em] h-[1em] ml-0.5 animate-pulse align-middle"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </pre>

        {typingDone && page.links && (
          <motion.div
            className="flex flex-wrap gap-2 mt-1 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {page.links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${mobile ? "text-xs px-3 py-1" : "text-[min(1.05vw,10.5px)] px-2 py-0.5"} rounded transition-colors`}
                style={{
                  border: `1px solid rgba(${accentRgb},0.35)`,
                  color: accentColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(${accentRgb},0.1)`;
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.6)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.35)`;
                }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}

        {typingDone && page.subPages && (
          <motion.div
            className="flex flex-col gap-1.5 mt-3 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {page.subPages.map((sp) => (
              <button
                key={sp.pageKey}
                onClick={() => goSub(sp.pageKey)}
                className={`text-left cursor-pointer ${mobile ? "text-xs px-3 py-2" : "text-[min(1.1vw,11px)] px-2 py-1"} rounded transition-colors`}
                style={{
                  border: `1px solid rgba(${accentRgb},0.25)`,
                  color: accentColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(${accentRgb},0.1)`;
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.5)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.25)`;
                }}
              >
                \u2192 {sp.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
