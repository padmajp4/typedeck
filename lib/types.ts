/** "custom" covers font files the user drops onto the page this session. */
export type FontSource = "google" | "fontshare" | "local" | "custom";

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

export type TextCase = "none" | "upper" | "lower" | "title";

/** Maps a case choice onto the CSS property that performs it. */
export const TEXT_TRANSFORM: Record<TextCase, "none" | "uppercase" | "lowercase" | "capitalize"> = {
  none: "none",
  upper: "uppercase",
  lower: "lowercase",
  title: "capitalize",
};

/** Everything the preview panes render with, shared by the grid and pairing views. */
export interface PreviewSettings {
  text: string;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  weight: number;
  italic: boolean;
  /** Case applied to preview text without altering what the user typed. */
  textCase: TextCase;
  /** When false, previews follow the page theme instead of the two colours below. */
  colorsEnabled: boolean;
  textColor: string;
  bgColor: string;
}

export const DEFAULT_SETTINGS: PreviewSettings = {
  text: "The quick brown fox jumps over the lazy dog",
  size: 48,
  letterSpacing: 0,
  lineHeight: 1.3,
  weight: 400,
  italic: false,
  textCase: "none",
  colorsEnabled: false,
  textColor: "#111111",
  bgColor: "#ffffff",
};
