import { deskSections, HERO_VIEW_BOX } from "./sections";
import type { DeskSection, DeskSectionId, SvgShape } from "./types";

interface ObjectOverlayProps {
  readonly activeSection: DeskSection;
  readonly onSelect: (id: DeskSectionId) => void;
  readonly onPreview: (id: DeskSectionId) => void;
  readonly onClearPreview: () => void;
}

export function ObjectOverlay({ activeSection, onSelect, onPreview, onClearPreview }: ObjectOverlayProps) {
  return (
    <svg className="absolute inset-0 z-30 hidden h-full w-full xl:block" viewBox={HERO_VIEW_BOX} preserveAspectRatio="xMidYMid meet">
      {deskSections
        .filter((section) => section.shape)
        .map((section) => (
          <ObjectPathControl
            key={section.id}
            section={section}
            active={activeSection.id === section.id}
            preview={activeSection.id === section.id}
            onSelect={() => onSelect(section.id)}
            onPreview={() => onPreview(section.id)}
            onClearPreview={onClearPreview}
          />
        ))}
    </svg>
  );
}

function ShapeElement({ shape, pathLength }: { readonly shape: SvgShape; readonly pathLength?: number }) {
  if (shape.kind === "rect") {
    return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} pathLength={pathLength} />;
  }

  return <path d={shape.d} pathLength={pathLength} />;
}

function ObjectPathControl({
  section,
  active,
  preview,
  onSelect,
  onPreview,
  onClearPreview,
}: {
  readonly section: DeskSection;
  readonly active: boolean;
  readonly preview: boolean;
  readonly onSelect: () => void;
  readonly onPreview: () => void;
  readonly onClearPreview: () => void;
}) {
  const isActive = section.id !== "identity" && (active || preview);
  const hitShape = section.hitShape ?? section.shape;

  if (
    !section.shape ||
    !hitShape ||
    section.anchorX === undefined ||
    section.anchorY === undefined ||
    section.labelX === undefined ||
    section.labelY === undefined
  ) {
    return null;
  }

  const labelWidth = Math.max(104, section.label.length * 10 + 40);
  const labelX = section.labelX - labelWidth / 2;
  const relayPath = `M ${section.anchorX} ${section.anchorY} C ${section.anchorX} ${Math.max(96, section.anchorY - 120)}, 832 96, 832 124`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Open ${section.label} from ${section.object}`}
      onClick={onSelect}
      onMouseEnter={onPreview}
      onMouseLeave={onClearPreview}
      onFocus={onPreview}
      onBlur={onClearPreview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className="cursor-pointer outline-none"
    >
      <title>{section.label}</title>
      {isActive && (
        <path
          d={relayPath}
          fill="none"
          stroke={section.accent}
          strokeWidth={2.2}
          strokeDasharray="10 14"
          strokeLinecap="round"
          opacity={0.72}
          style={{ filter: `drop-shadow(0 0 0.55rem ${section.accent})` }}
        >
          <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />
        </path>
      )}
      <g
        opacity={isActive ? 1 : 0}
        style={{
          filter: isActive ? `drop-shadow(0 0 0.9rem ${section.accent}) drop-shadow(0 0 1.8rem rgba(255,255,255,0.72))` : "none",
          transition: "opacity 180ms ease, filter 180ms ease, transform 180ms ease",
          transform: isActive ? "translateY(-3px)" : "translateY(0)",
        }}
      >
        <g
          fill={`${section.accent}18`}
          stroke={section.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={5.2}
        >
          <ShapeElement shape={section.shape} />
        </g>
        <g
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          strokeDasharray="0.18 0.82"
          opacity={0.78}
        >
          <ShapeElement shape={section.shape} pathLength={1} />
          <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.4s" repeatCount="indefinite" />
        </g>
      </g>
      <g fill="rgba(255,255,255,0.001)" stroke="transparent" strokeWidth={34}>
        <ShapeElement shape={hitShape} />
      </g>
      <g opacity={isActive ? 1 : 0} style={{ transition: "opacity 160ms ease" }}>
        <rect
          x={labelX}
          y={section.labelY - 23}
          width={labelWidth}
          height={34}
          rx={17}
          fill="rgba(255,252,244,0.88)"
          stroke={section.accent}
          strokeWidth={1.4}
          style={{ filter: "drop-shadow(0 12px 22px rgba(80,62,41,0.18))" }}
        />
        <text
          x={section.labelX}
          y={section.labelY + 4}
          textAnchor="middle"
          fill="#182016"
          fontFamily='"SFMono-Regular", "Cascadia Code", ui-monospace, monospace'
          fontSize={14}
          fontWeight={700}
          letterSpacing={0.08}
        >
          {section.label}
        </text>
      </g>
    </g>
  );
}
