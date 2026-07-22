import { deskSections } from "./sections";
import type { DeskSection, DeskSectionId } from "./types";

interface SectionDockProps {
  readonly activeSection: DeskSection;
  readonly onSelect: (id: DeskSectionId) => void;
  readonly onPreview: (id: DeskSectionId) => void;
  readonly onClearPreview: () => void;
}

export function SectionDock({ activeSection, onSelect, onPreview, onClearPreview }: SectionDockProps) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-full border border-white/70 bg-white/62 p-2 shadow-[0_18px_70px_rgba(88,68,42,0.18),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md">
      {deskSections.map((section) => {
        const active = activeSection.id === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            onMouseEnter={() => onPreview(section.id)}
            onMouseLeave={onClearPreview}
            onFocus={() => onPreview(section.id)}
            onBlur={onClearPreview}
            aria-pressed={active}
            className="shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.11em] shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
            style={{
              borderColor: active ? section.accent : "rgba(111,90,62,0.14)",
              color: active ? "#182016" : "rgba(45,54,43,0.68)",
              backgroundColor: active ? `${section.accent}33` : "rgba(255,255,255,0.48)",
            }}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}
