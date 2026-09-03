import { DEFAULT_SETTINGS, type PreviewSettings } from "./types";

/**
 * The full browsing state, encoded into the URL fragment so a view can be
 * shared or bookmarked. The fragment is used rather than a query string so
 * nothing is sent to the server and no navigation is needed to update it.
 */
export interface ShareState {
  settings: PreviewSettings;
  tab: string;
  category: string;
  search: string;
  sort: string;
  columns: number;
  view: string;
  pairHeading: string | null;
  pairBody: string | null;
}

export const DEFAULT_SHARE: Omit<ShareState, "settings"> = {
  tab: "all",
  category: "all",
  search: "",
  sort: "popular",
  columns: 2,
  view: "grid",
  pairHeading: null,
  pairBody: null,
};

/** Short keys keep the shared link readable. */
const KEYS = {
  text: "t",
  size: "s",
  letterSpacing: "ls",
  lineHeight: "lh",
  weight: "w",
  italic: "i",
  colorsEnabled: "co",
  textColor: "fg",
  bgColor: "bg",
  tab: "tb",
  category: "ct",
  search: "q",
  sort: "so",
  columns: "c",
  view: "v",
  pairHeading: "ph",
  pairBody: "pb",
} as const;

export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  const { settings } = state;

  // Only non-default values are written, so a plain view yields a short link.
  const put = (key: string, value: unknown, fallback: unknown) => {
    if (value === fallback || value === null || value === "") return;
    params.set(key, typeof value === "boolean" ? "1" : String(value));
  };

  put(KEYS.text, settings.text, DEFAULT_SETTINGS.text);
  put(KEYS.size, settings.size, DEFAULT_SETTINGS.size);
  put(KEYS.letterSpacing, settings.letterSpacing, DEFAULT_SETTINGS.letterSpacing);
  put(KEYS.lineHeight, settings.lineHeight, DEFAULT_SETTINGS.lineHeight);
  put(KEYS.weight, settings.weight, DEFAULT_SETTINGS.weight);
  put(KEYS.italic, settings.italic, DEFAULT_SETTINGS.italic);
  put(KEYS.colorsEnabled, settings.colorsEnabled, DEFAULT_SETTINGS.colorsEnabled);
  if (settings.colorsEnabled) {
    put(KEYS.textColor, settings.textColor, null);
    put(KEYS.bgColor, settings.bgColor, null);
  }

  put(KEYS.tab, state.tab, DEFAULT_SHARE.tab);
  put(KEYS.category, state.category, DEFAULT_SHARE.category);
  put(KEYS.search, state.search, DEFAULT_SHARE.search);
  put(KEYS.sort, state.sort, DEFAULT_SHARE.sort);
  put(KEYS.columns, state.columns, DEFAULT_SHARE.columns);
  put(KEYS.view, state.view, DEFAULT_SHARE.view);
  put(KEYS.pairHeading, state.pairHeading, DEFAULT_SHARE.pairHeading);
  put(KEYS.pairBody, state.pairBody, DEFAULT_SHARE.pairBody);

  return params.toString();
}

/** Clamp a parsed number, falling back to the default when absent or invalid. */
function num(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function oneOf<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = params.get(key);
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Parse a fragment back into state. Every field is validated, since the
 * fragment is attacker-supplied in a shared link.
 */
export function decodeShareState(fragment: string): Partial<ShareState> | null {
  const clean = fragment.replace(/^#/, "");
  if (!clean) return null;

  const params = new URLSearchParams(clean);
  if ([...params.keys()].length === 0) return null;

  const textColor = params.get(KEYS.textColor);
  const bgColor = params.get(KEYS.bgColor);

  const settings: PreviewSettings = {
    text: (params.get(KEYS.text) ?? DEFAULT_SETTINGS.text).slice(0, 300),
    size: num(params, KEYS.size, DEFAULT_SETTINGS.size, 8, 200),
    letterSpacing: num(params, KEYS.letterSpacing, DEFAULT_SETTINGS.letterSpacing, -0.1, 0.5),
    lineHeight: num(params, KEYS.lineHeight, DEFAULT_SETTINGS.lineHeight, 0.8, 3),
    weight: num(params, KEYS.weight, DEFAULT_SETTINGS.weight, 100, 900),
    italic: params.get(KEYS.italic) === "1",
    colorsEnabled: params.get(KEYS.colorsEnabled) === "1",
    textColor: textColor && HEX.test(textColor) ? textColor : DEFAULT_SETTINGS.textColor,
    bgColor: bgColor && HEX.test(bgColor) ? bgColor : DEFAULT_SETTINGS.bgColor,
  };

  return {
    settings,
    tab: oneOf(
      params,
      KEYS.tab,
      ["all", "local", "custom", "google", "fontshare", "favorites", "selected", "hidden"] as const,
      "all",
    ),
    category: oneOf(
      params,
      KEYS.category,
      ["all", "Sans Serif", "Serif", "Monospace", "Display", "Handwriting", "Other"] as const,
      "all",
    ),
    search: (params.get(KEYS.search) ?? "").slice(0, 100),
    sort: oneOf(params, KEYS.sort, ["popular", "az", "za", "recent", "random"] as const, "popular"),
    columns: [1, 2, 3, 4, 6].includes(num(params, KEYS.columns, 2, 1, 6))
      ? num(params, KEYS.columns, 2, 1, 6)
      : 2,
    view: oneOf(params, KEYS.view, ["grid", "pair"] as const, "grid"),
    pairHeading: params.get(KEYS.pairHeading),
    pairBody: params.get(KEYS.pairBody),
  };
}
