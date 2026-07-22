import { useEffect, useMemo, useState } from "react";
import { getDaylight, type DaylightState } from "./desk-hero/daylight";
import { DeskObjectLayer } from "./desk-hero/DeskObjectLayer";
import { MobileObjectGrid } from "./desk-hero/MobileObjectGrid";
import { MonitorScreen } from "./desk-hero/MonitorScreen";
import { SectionDock } from "./desk-hero/SectionDock";
import { deskSections, sectionById } from "./desk-hero/sections";
import type { DeskHeroProps, DeskSectionId } from "./desk-hero/types";

const HERO_IMAGE_BASE = "/hero-desk-neutral";
const homeLinks = [
  ["CV", "/cv"],
  ["UBE", "/ube"],
  ["Education", "/education"],
  ["AI", "/ai"],
  ["Research", "/research"],
  ["Contact", "/contact"],
] as const;

function DeskPhoto({ priority = false }: { readonly priority?: boolean }) {
  return (
    <picture className="absolute inset-0">
      <source srcSet={`${HERO_IMAGE_BASE}.avif`} type="image/avif" />
      <source srcSet={`${HERO_IMAGE_BASE}.webp`} type="image/webp" />
      <img
        src={`${HERO_IMAGE_BASE}.jpg`}
        alt=""
        width={1672}
        height={941}
        className="h-full w-full object-cover"
        draggable={false}
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}

function DaylightWash({ daylight }: { readonly daylight: DaylightState }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,229,0.62)_0%,rgba(255,255,255,0.16)_34%,rgba(255,255,255,0)_64%,rgba(75,62,48,0.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_18%,rgba(255,255,255,0.86),transparent_24rem),radial-gradient(circle_at_59%_78%,rgba(232,179,104,0.24),transparent_22rem),radial-gradient(circle_at_86%_34%,rgba(85,129,156,0.14),transparent_24rem)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(81,61,38,0.18))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(84,70,50,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,70,50,.12)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(90deg, ${daylight.window} 0%, transparent 58%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(64,82,124,${(daylight.cool * 0.9).toFixed(3)})` }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(14,18,30,${(daylight.dim * 0.72).toFixed(3)})` }}
      />
    </>
  );
}

function StageLight({ daylight }: { readonly daylight: DaylightState }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(94deg, ${daylight.window} 0%, transparent 54%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(60,78,120,${daylight.cool.toFixed(3)})` }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(12,16,28,${daylight.dim.toFixed(3)})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: daylight.lamp,
          background:
            "radial-gradient(ellipse 30% 36% at 18% 38%, rgba(255,199,120,0.66), rgba(255,180,96,0.24) 55%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: daylight.lamp * 0.85,
          background:
            "radial-gradient(ellipse 38% 22% at 40% 86%, rgba(255,190,110,0.34), transparent 72%)",
        }}
      />
    </div>
  );
}

function DaylightChip({ daylight, now }: { readonly daylight: DaylightState; readonly now: Date | null }) {
  const hours = now ? String(Math.floor(daylight.hour)).padStart(2, "0") : "--";
  const minutes = now ? String(Math.floor((daylight.hour % 1) * 60)).padStart(2, "0") : "--";

  return (
    <div className="absolute left-[2.4%] top-[3.6%] z-40 flex items-center gap-2.5 rounded-full border border-white/56 bg-[#fffaf0]/62 px-3.5 py-2 shadow-[0_14px_36px_rgba(56,44,31,0.16),inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-md">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: daylight.window, boxShadow: `0 0 10px ${daylight.window}` }}
      />
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#182016]/76">
        {hours}:{minutes} local · {daylight.label}
      </p>
    </div>
  );
}

export default function DeskHero({ metrics, publications, presentations }: DeskHeroProps) {
  const [selectedId, setSelectedId] = useState<DeskSectionId>("identity");
  const [previewId, setPreviewId] = useState<DeskSectionId | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [hourOverride, setHourOverride] = useState<number | null>(null);
  const activeId = previewId ?? selectedId;
  const activeSection = useMemo(() => sectionById.get(activeId) ?? deskSections[0], [activeId]);
  const daylight = getDaylight(now, hourOverride);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("hour");

    if (param !== null) {
      const parsed = Number.parseFloat(param);

      if (Number.isFinite(parsed)) {
        setHourOverride(parsed);
      }
    }
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#f4efe5] text-[#182016]">
      <div className="absolute inset-0 scale-[1.035] opacity-45 blur-[5px] saturate-[0.92]">
        <DeskPhoto />
      </div>
      <DaylightWash daylight={daylight} />

      <header className="relative z-50 mx-auto flex w-full max-w-[1560px] items-center justify-between px-5 py-5 sm:px-8">
        <button
          type="button"
          onClick={() => setSelectedId("identity")}
          className="rounded-full border border-white/70 bg-white/64 px-4 py-2 font-serif text-xl tracking-[-0.04em] text-[#182016] shadow-[0_18px_60px_rgba(88,68,42,0.16),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/82 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
        >
          TakMD
        </button>
        <nav
          className="hidden items-center gap-2 rounded-full border border-white/64 bg-white/58 p-1.5 shadow-[0_16px_50px_rgba(88,68,42,0.14),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-md md:flex"
          aria-label="Home navigation"
        >
          {homeLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#2d362b]/68 transition hover:bg-white/72 hover:text-[#182016] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href="/cv"
          className="rounded-full border border-[#182016]/12 bg-[#182016] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#fffaf0] shadow-[0_16px_44px_rgba(24,32,22,0.18)] transition hover:-translate-y-0.5 hover:bg-[#2d362b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
        >
          Living CV
        </a>
      </header>

      <div
        data-desk-stage
        className="relative z-10 mx-auto hidden aspect-video max-w-[1920px] overflow-visible xl:block"
        style={{ width: "min(100vw, calc((100svh - 84px) * 1.7777778))" }}
      >
        <DeskPhoto priority />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.24),rgba(255,255,255,0.04)_42%,rgba(72,58,42,0.1)_100%)]" />
        <div className="pointer-events-none absolute inset-x-[18%] bottom-[5%] h-[22%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(232,179,104,0.18),transparent_68%)] blur-[10px]" />
        <StageLight daylight={daylight} />
        <DaylightChip daylight={daylight} now={now} />

        <div className="absolute left-[23.4%] top-[9.3%] z-40 h-[48%] w-[53.2%]">
          <MonitorScreen
            section={activeSection}
            metrics={metrics}
            publications={publications}
            presentations={presentations}
          />
        </div>

        <DeskObjectLayer
          activeSection={activeSection}
          daylight={daylight}
          now={now}
          onSelect={setSelectedId}
          onPreview={setPreviewId}
          onClearPreview={() => setPreviewId(null)}
        />

        <div className="absolute bottom-[3.4%] left-1/2 z-40 w-[min(92%,980px)] -translate-x-1/2">
          <SectionDock
            activeSection={activeSection}
            onSelect={setSelectedId}
            onPreview={setPreviewId}
            onClearPreview={() => setPreviewId(null)}
          />
        </div>

      </div>

      <div className="relative z-10 mx-auto min-h-[calc(100svh-84px)] w-full max-w-[1560px] px-5 pb-7 sm:px-8 xl:hidden">
        <div className="grid gap-5 pt-5">
          <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_24px_80px_rgba(88,68,42,0.18)] backdrop-blur-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#6f5a3e]/70">
              Daylit desk OS
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.94] tracking-[-0.07em] text-[#182016] sm:text-6xl">
              Woon Tak Yuh, MD
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#2d362b]/72">
              A working monitor for spine surgery, education, research, AI workflow, talks, and field notes.
            </p>
          </div>

          <SectionDock
            activeSection={activeSection}
            onSelect={setSelectedId}
            onPreview={setPreviewId}
            onClearPreview={() => setPreviewId(null)}
          />

          <MonitorScreen
            section={activeSection}
            metrics={metrics}
            publications={publications}
            presentations={presentations}
          />

          <MobileObjectGrid
            activeSection={activeSection}
            now={now}
            onSelect={setSelectedId}
            onPreview={setPreviewId}
            onClearPreview={() => setPreviewId(null)}
          />
        </div>
      </div>
    </section>
  );
}
