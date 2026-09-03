import type { FontFile, FontItem } from "./types";

/**
 * Loading every catalogued family at once would mean thousands of network
 * requests, so families are fetched on demand as their cards scroll into view,
 * and only in the specific weight and slant currently being previewed.
 */

/** Identifies one concrete style of one family. */
function styleKey(id: string, weight: number, italic: boolean) {
  return `${id}@${weight}${italic ? "i" : ""}`;
}

const requested = new Set<string>();
const loaded = new Set<string>();
const listeners = new Set<(key: string) => void>();

export function isStyleLoaded(font: FontItem, weight: number, italic: boolean) {
  return loaded.has(styleKey(font.id, weight, italic));
}

export function onFontLoaded(listener: (key: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function markLoaded(key: string) {
  loaded.add(key);
  for (const listener of listeners) listener(key);
}

/**
 * Snap a requested weight to one the family actually ships, so previews show a
 * real cut rather than a browser-synthesised approximation.
 */
export function resolveWeight(font: FontItem, requestedWeight: number) {
  if (font.weights.includes(requestedWeight)) return requestedWeight;
  // Variable fonts interpolate, so any value inside the axis range is real.
  const wght = font.axes.find((a) => a.tag === "wght");
  if (wght && requestedWeight >= wght.min && requestedWeight <= wght.max) {
    return requestedWeight;
  }
  return (
    font.weights.find((w) => w >= requestedWeight) ?? font.weights.at(-1) ?? 400
  );
}

function googleHref(font: FontItem, weight: number, italic: boolean) {
  // Encoded, not just space-substituted: a family name carrying "&" or "?"
  // would otherwise inject query parameters into the request.
  const family = encodeURIComponent(font.family);
  // css2 requires axis tags in alphabetical order, and `ital` precedes `wght`.
  const spec = italic ? `:ital,wght@1,${weight}` : `:wght@${weight}`;
  return `https://fonts.googleapis.com/css2?family=${family}${spec}&display=swap`;
}

function loadGoogle(font: FontItem, weight: number, italic: boolean, key: string) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleHref(font, weight, italic);
  link.addEventListener("load", () => markLoaded(key));
  // A failed family should not leave its card stuck at reduced opacity.
  link.addEventListener("error", () => markLoaded(key));
  document.head.appendChild(link);
}

/** Pick the shipped file closest to the requested style. */
function pickFile(files: FontFile[], weight: number, italic: boolean) {
  const matchingSlant = files.filter((f) => f.italic === italic);
  const pool = matchingSlant.length ? matchingSlant : files;
  return pool.reduce<FontFile | undefined>(
    (best, file) =>
      !best || Math.abs(file.weight - weight) < Math.abs(best.weight - weight)
        ? file
        : best,
    undefined,
  );
}

/**
 * The file URL is interpolated into a CSS descriptor, so accept only a plain
 * https URL on the expected CDN. This bounds the damage if the upstream
 * catalogue ever returns something hostile.
 */
function isSafeFontUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "cdn.fontshare.com" &&
      !/["'()\\]/.test(url)
    );
  } catch {
    return false;
  }
}

async function loadFontshare(
  font: FontItem,
  weight: number,
  italic: boolean,
  key: string,
) {
  const file = pickFile(font.files ?? [], weight, italic);
  if (!file || !isSafeFontUrl(file.url)) return markLoaded(key);

  try {
    const face = new FontFace(font.family, `url(${file.url}) format('woff2')`, {
      weight: String(file.weight),
      style: file.italic ? "italic" : "normal",
    });
    await face.load();
    document.fonts.add(face);
  } catch {
    // Ignore: the card falls back to the generic family.
  }
  markLoaded(key);
}

export function loadFont(font: FontItem, weight: number, italic: boolean) {
  const key = styleKey(font.id, weight, italic);
  if (requested.has(key)) return;
  requested.add(key);

  // Local fonts are already installed on the machine; nothing to fetch.
  if (font.source === "local") return markLoaded(key);
  if (font.source === "google") return loadGoogle(font, weight, italic, key);
  void loadFontshare(font, weight, italic, key);
}

/**
 * The CSS `font-family` value for a card, with a category-appropriate generic
 * so an unloaded or failed family still previews sensibly.
 */
export function fontFamilyValue(font: FontItem) {
  const generic =
    font.category === "Monospace"
      ? "monospace"
      : font.category === "Serif"
        ? "serif"
        : font.category === "Handwriting"
          ? "cursive"
          : "sans-serif";
  return `"${font.family.replace(/"/g, "")}", ${generic}`;
}
