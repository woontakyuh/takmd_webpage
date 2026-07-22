import { motion } from "framer-motion";
import { objectLightFilter, type DaylightState } from "./daylight";
import { deskSections } from "./sections";
import type { DeskObjectLayer as DeskObjectLayerModel, DeskSection, DeskSectionId } from "./types";

interface DeskObjectLayerProps {
  readonly activeSection: DeskSection;
  readonly daylight: DaylightState;
  readonly now: Date | null;
  readonly onSelect: (id: DeskSectionId) => void;
  readonly onPreview: (id: DeskSectionId) => void;
  readonly onClearPreview: () => void;
}

interface ObjectButtonProps {
  readonly section: DeskSection;
  readonly active: boolean;
  readonly daylight: DaylightState;
  readonly now: Date | null;
  readonly onSelect: () => void;
  readonly onPreview: () => void;
  readonly onClearPreview: () => void;
}

interface ObjectVisualProps {
  readonly layer: DeskObjectLayerModel;
  readonly section: DeskSection;
  readonly active: boolean;
  readonly daylight: DaylightState;
  readonly now: Date | null;
}

export function DeskObjectLayer({ activeSection, daylight, now, onSelect, onPreview, onClearPreview }: DeskObjectLayerProps) {
  return (
    <div className="absolute inset-0 z-30 hidden xl:block" aria-label="Interactive desk objects">
      {deskSections
        .filter((section) => section.layer)
        .map((section) => (
          <ObjectButton
            key={section.id}
            section={section}
            active={activeSection.id === section.id}
            daylight={daylight}
            now={now}
            onSelect={() => onSelect(section.id)}
            onPreview={() => onPreview(section.id)}
            onClearPreview={onClearPreview}
          />
        ))}
    </div>
  );
}

function ObjectButton({ section, active, daylight, now, onSelect, onPreview, onClearPreview }: ObjectButtonProps) {
  const layer = section.layer;

  if (!layer) {
    return null;
  }

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      aria-label={`${section.label}: ${layer.alt}`}
      onClick={onSelect}
      onMouseEnter={onPreview}
      onMouseLeave={onClearPreview}
      onFocus={onPreview}
      onBlur={onClearPreview}
      className="group absolute cursor-pointer outline-none"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        zIndex: active ? 55 : (layer.zIndex ?? 35),
      }}
      initial={false}
      animate={{ y: active ? -8 : 0, scale: active ? 1.045 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[10%] rounded-[38%] opacity-0 blur-2xl transition duration-300 group-hover:opacity-70 group-focus-visible:opacity-70"
        style={{ backgroundColor: section.accent }}
      />
      <ObjectVisual layer={layer} section={section} active={active} daylight={daylight} now={now} />
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/72 bg-[#fffaf0]/88 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#182016] opacity-0 shadow-[0_12px_28px_rgba(56,44,31,0.18)] backdrop-blur-md transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          layer.labelPosition === "bottom" ? "bottom-0 translate-y-[130%]" : "top-0 -translate-y-[78%]"
        }`}
        style={{ borderColor: active ? section.accent : "rgba(255,255,255,0.72)" }}
      >
        {section.label}
      </span>
    </motion.button>
  );
}

function ObjectVisual({ layer, section, active, daylight, now }: ObjectVisualProps) {
  const opacity = active ? 1 : (layer.inactiveOpacity ?? 1);
  const light = active ? "" : ` ${objectLightFilter(daylight)}`;
  const filter = active
    ? `drop-shadow(0 0 0.45rem ${section.accent}) drop-shadow(0 0 1.2rem ${section.accent}) drop-shadow(0 18px 24px rgba(38,28,18,0.24))`
    : `drop-shadow(0 14px 18px rgba(38,28,18,0.18))${light}`;

  if (layer.kind === "live-clock") {
    return <LiveCalendarClock layer={layer} filter={filter} now={now} opacity={opacity} />;
  }

  return (
    <img
      src={layer.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="relative h-full w-full object-contain transition duration-300 group-hover:saturate-[1.08] group-focus-visible:saturate-[1.08]"
      style={{ filter, opacity }}
    />
  );
}

function LiveCalendarClock({
  layer,
  filter,
  now,
  opacity,
}: {
  readonly layer: DeskObjectLayerModel;
  readonly filter: string;
  readonly now: Date | null;
  readonly opacity: number;
}) {
  const clock = getClockParts(now);

  return (
    <div className="relative h-full w-full" style={{ filter, opacity }}>
      <img src={layer.src} alt="" aria-hidden="true" draggable={false} className="h-full w-full object-contain" />
      <div className="absolute left-[13%] top-[30%] w-[52%] rotate-[3deg] text-left text-[#263327]">
        <p className="font-mono text-[0.6vw] font-bold uppercase tracking-[0.24em] text-[#b4864a]">Current</p>
        <div className="mt-[3%] flex items-end justify-between gap-2">
          <p className="font-serif text-[1.9vw] leading-none tracking-[-0.06em]">{clock.date}</p>
          <p className="pb-[1%] font-mono text-[0.85vw] font-bold tabular-nums">{clock.time}</p>
        </div>
        <p className="mt-[3.5%] font-mono text-[0.66vw] font-bold uppercase tracking-[0.3em] text-[#263327]/54">{clock.year}</p>
      </div>
    </div>
  );
}

function getClockParts(now: Date | null) {
  if (!now) {
    return {
      year: "----",
      date: "--.--",
      time: "--:--:--",
    };
  }

  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return {
    year,
    date: `${month}.${day}`,
    time: `${hours}:${minutes}:${seconds}`,
  };
}
