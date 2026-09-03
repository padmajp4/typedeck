export type FontSource = "google" | "fontshare" | "local";

export type FontCategory =
  | "Sans Serif"
  | "Serif"
  | "Monospace"
  | "Display"
  | "Handwriting"
  | "Other";

export interface FontFile {
  weight: number;
  italic: boolean;
  url: string;
}

export interface FontAxis {
  tag: string;
  min: number;
  max: number;
  defaultValue: number;
}

export interface FontItem {
  /** Stable unique key: `${source}:${family}` */
  id: string;
  family: string;
  source: FontSource;
  category: FontCategory;
  /** Available numeric weights, ascending. */
  weights: number[];
  hasItalic: boolean;
  /** Variable-font axes, empty for static fonts. */
  axes: FontAxis[];
  designers: string[];
  /** Google popularity rank (lower = more popular); undefined for other sources. */
  popularity?: number;
  /** ISO date the family was added to its catalogue. */
  dateAdded?: string;
  /** Where a user can download the family. */
  downloadUrl?: string;
  /**
   * Individual style files, for sources we build @font-face rules from
   * (Fontshare). Google families are loaded through their CSS API instead.
   */
  files?: FontFile[];
}

export const CATEGORIES: FontCategory[] = [
  "Sans Serif",
  "Serif",
  "Monospace",
  "Display",
  "Handwriting",
];
