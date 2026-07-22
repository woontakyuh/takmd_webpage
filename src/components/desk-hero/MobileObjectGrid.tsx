import { formatLiveDate } from "./format";
import { deskSections } from "./sections";
import type { DeskSection, DeskSectionId } from "./types";

interface MobileObjectGridProps {
  readonly activeSection: DeskSection;
  readonly now: Date | null;
  readonly onSelect: (id: DeskSectionId) => void;
  readonly onPreview: (id: DeskSectionId) => void;
  readonly onClearPreview: () => void;
}

export function MobileObjectGrid({
  activeSection,
  now,
  onSelect,
  onPreview,
  onClearPreview,
}: MobileObjectGridProps) {
  const objectSections = deskSections.filter((section) => section.layer);

  return (
    <div className="grid grid-cols-2 gap-3 xl:hidden">
      {objectSections.map((section) => {
        const isActive = activeSection.id === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            onMouseEnter={() => onPreview(section.id)}
            onMouseLeave={onClearPreview}
            className="rounded-[24px] border bg-white/58 p-4 text-left shadow-[0_20px_60px_rgba(88,68,42,0.16),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-md transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
            style={{
              borderColor: isActive ? section.accent : "rgba(111,90,62,0.14)",
              boxShadow: isActive ? `0 0 34px ${section.accent}44, 0 20px 60px rgba(88,68,42,0.16)` : "0 20px 60px rgba(88,68,42,0.16)",
            }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: section.accent }}>
              {section.object}
            </span>
            <span className="mt-2 block text-lg font-semibold text-[#182016]">{section.label}</span>
            {section.id === "presentations" && (
              <span className="mt-3 block font-mono text-sm text-[#2d362b]/72">{formatLiveDate(now).time}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
