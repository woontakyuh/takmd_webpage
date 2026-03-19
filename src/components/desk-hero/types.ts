export type HotspotId =
  | "ube"
  | "myself"
  | "research"
  | "education"
  | "personal"
  | "schedule"
  | "roles";

export interface Marker {
  id: HotspotId;
  label: string;
  /** centre of the dot, as % of image */
  x: number;
  y: number;
  color: string;
  rgb: string;
}

export interface TermPage {
  command: string;
  lines: string[];
  links?: { label: string; url: string }[];
  subPages?: { label: string; pageKey: string }[];
}
