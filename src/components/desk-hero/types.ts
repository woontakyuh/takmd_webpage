export type DeskSectionId =
  | "identity"
  | "surgery"
  | "research"
  | "education"
  | "ai"
  | "presentations"
  | "personal";

export type SvgShape =
  | {
      readonly kind: "path";
      readonly d: string;
    }
  | {
      readonly kind: "rect";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
    };

interface DeskObjectLayerBase {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly zIndex?: number;
  readonly inactiveOpacity?: number;
  /** Where the hover label chip attaches; use "bottom" when the object's top sits behind the monitor. */
  readonly labelPosition?: "top" | "bottom";
}

export type DeskObjectLayer =
  | (DeskObjectLayerBase & {
      readonly kind: "image";
      readonly src: string;
      readonly alt: string;
    })
  | (DeskObjectLayerBase & {
      readonly kind: "live-clock";
      readonly src: string;
      readonly alt: string;
    });

export interface HomeMetrics {
  readonly publications: number;
  readonly firstAuthor: number;
  readonly presentations: number;
  readonly cases: number;
  readonly latestCase: string;
  readonly trainingCountries: string;
}

export interface PublicationPreview {
  readonly title: string;
  readonly journal: string;
  readonly year: number;
  readonly role: string;
  readonly url: string;
}

export interface PresentationPreview {
  readonly date: string;
  readonly name: string;
  readonly place: string;
  readonly topic: string;
}

export interface DeskHeroProps {
  readonly metrics: HomeMetrics;
  readonly publications: readonly PublicationPreview[];
  readonly presentations: readonly PresentationPreview[];
}

export interface DeskSection {
  readonly id: DeskSectionId;
  readonly label: string;
  readonly object: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly href: string;
  readonly hrefLabel: string;
  readonly secondaryHref?: string;
  readonly secondaryHrefLabel?: string;
  readonly accent: string;
  readonly layer?: DeskObjectLayer;
  readonly shape?: SvgShape;
  readonly hitShape?: SvgShape;
  readonly anchorX?: number;
  readonly anchorY?: number;
  readonly labelX?: number;
  readonly labelY?: number;
}
