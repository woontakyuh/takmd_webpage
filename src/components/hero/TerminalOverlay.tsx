import { useState, useEffect, useRef } from "react";

const SEQUENCES = [
  { prompt: "$ whoami", output: "> surgeon-scientist" },
  { prompt: "$ cat focus.md", output: "> UBE × AI × Global Education" },
  { prompt: "$ uptime", output: "> 29 papers | 11+ countries | h-index 11" },
];

const CHAR_DELAY = 45;
const LINE_PAUSE = 400;
const LOOP_DELAY = 5000;

interface Props {
  style: React.CSSProperties;
}

export default function TerminalOverlay({ style }: Props) {
  const [lines, setLines] = useState<{ text: string; type: "prompt" | "output" }[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function typeText(text: string, type: "prompt" | "output") {
      for (let i = 1; i <= text.length; i++) {
        if (cancelled) return;
        setLines((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.type === type) {
            next[next.length - 1] = { text: text.slice(0, i), type };
          } else {
            next.push({ text: text.slice(0, i), type });
          }
          return next;
        });
        await sleep(CHAR_DELAY);
      }
    }

    async function runLoop() {
      while (!cancelled) {
        setLines([]);
        setTyping(true);

        for (const seq of SEQUENCES) {
          if (cancelled) return;
          await typeText(seq.prompt, "prompt");
          await sleep(LINE_PAUSE);
          await typeText(seq.output, "output");
          await sleep(LINE_PAUSE);
        }

        setTyping(false);
        await sleep(LOOP_DELAY);
      }
    }

    runLoop();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={style}
    >
      <div className="w-full h-full flex flex-col justify-center px-[8%] py-[6%] gap-[0.3em]">
        {lines.map((line, i) => (
          <div
            key={`${i}-${line.text}`}
            className="font-mono leading-relaxed whitespace-nowrap overflow-hidden"
            style={{ fontSize: "clamp(6px, 1.4vw, 16px)" }}
          >
            {line.type === "prompt" ? (
              <span className="text-green-400">{line.text}</span>
            ) : (
              <span className="text-white/80">{line.text}</span>
            )}
            {i === lines.length - 1 && (
              <span
                className="inline-block w-[0.55em] h-[1.1em] bg-green-400 ml-0.5 align-middle"
                style={{ opacity: cursorVisible ? 1 : 0 }}
              />
            )}
          </div>
        ))}
        {lines.length === 0 && (
          <span
            className="inline-block w-[0.55em] h-[1.1em] bg-green-400"
            style={{
              opacity: cursorVisible ? 1 : 0,
              fontSize: "clamp(6px, 1.4vw, 16px)",
            }}
          />
        )}
      </div>
    </div>
  );
}
