import type { FontCategory, FontItem } from "./types";

interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

declare global {
  interface Window {
    queryLocalFonts?: () => Promise<FontData[]>;
  }
}

export function supportsLocalFonts() {
  return typeof window !== "undefined" && typeof window.queryLocalFonts === "function";
}

export type LocalFontPermission = "granted" | "denied" | "prompt" | "unknown";

/**
 * Reads the real, browser-persisted permission state, so the app can tell a
 * user who already granted access from one who has not been asked yet. This
 * matters because component state resets on every navigation, but the
 * browser's own grant does not — checking it first avoids re-showing the
 * "Grant font access" button (and re-querying) for someone who already said
 * yes.
 */
export async function getLocalFontsPermission(): Promise<LocalFontPermission> {
  if (!supportsLocalFonts()) return "unknown";
  try {
    // "local-fonts" is not yet in TypeScript's PermissionName union.
    const status = await navigator.permissions.query({
      name: "local-fonts" as PermissionName,
    });
    return status.state as LocalFontPermission;
  } catch {
    // Some browsers support queryLocalFonts but not querying its permission.
    return "unknown";
  }
}

/**
 * The OS exposes no classification for installed fonts, so infer one from the
 * family name. It is a hint for filtering, not a guarantee.
 */
function guessCategory(family: string): FontCategory {
  const name = family.toLowerCase();
  if (/\b(mono|code|console|courier|terminal|typewriter)\b/.test(name)) return "Monospace";
  if (/\b(script|hand|brush|write|writing|signature)\b/.test(name)) return "Handwriting";
  if (/\b(serif|times|georgia|garamond|baskerville|didot|palatino|caslon|bodoni)\b/.test(name)) {
    // "Sans Serif" also contains "serif", so exclude the sans families first.
    return /\bsans\b/.test(name) ? "Sans Serif" : "Serif";
  }
  if (/\b(sans|helvetica|arial|verdana|tahoma|grotesk|gothic)\b/.test(name)) return "Sans Serif";
  if (/\b(display|deco|poster|stencil|ornament)\b/.test(name)) return "Display";
  return "Other";
}

const STYLE_WEIGHTS: [RegExp, number][] = [
  [/\bthin\b/i, 100],
  [/\bextra ?light\b/i, 200],
  [/\blight\b/i, 300],
  [/\b(regular|book|normal)\b/i, 400],
  [/\bmedium\b/i, 500],
  [/\bsemi ?bold\b/i, 600],
  [/\bextra ?bold\b/i, 800],
  [/\b(black|heavy)\b/i, 900],
  [/\bbold\b/i, 700],
];

function weightFromStyle(style: string) {
  for (const [pattern, weight] of STYLE_WEIGHTS) {
    if (pattern.test(style)) return weight;
  }
  return 400;
}

/**
 * Prompts for permission and reads the installed font list. Chromium-only;
 * resolves to an empty array when unsupported or denied.
 */
export async function queryLocalFonts(): Promise<FontItem[]> {
  if (!supportsLocalFonts()) return [];

  const faces = await window.queryLocalFonts!();
  const byFamily = new Map<string, FontData[]>();
  for (const face of faces) {
    const group = byFamily.get(face.family);
    if (group) group.push(face);
    else byFamily.set(face.family, [face]);
  }

  return [...byFamily.entries()]
    .map(([family, styles]) => ({
      id: `local:${family}`,
      family,
      source: "local" as const,
      category: guessCategory(family),
      weights: [...new Set(styles.map((s) => weightFromStyle(s.style)))].sort((a, b) => a - b),
      hasItalic: styles.some((s) => /italic|oblique/i.test(s.style)),
      axes: [],
      designers: [],
    }))
    .sort((a, b) => a.family.localeCompare(b.family));
}
