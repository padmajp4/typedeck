import { loadStoredFonts, saveFont, type StoredFont } from "./fontStore";
import type { FontItem } from "./types";

const SUPPORTED = /\.(ttf|otf|woff2?|ttc)$/i;

/** Turn "Inter-SemiBoldItalic.woff2" into "Inter SemiBold Italic". */
function familyFromFilename(name: string) {
  return (
    name
      .replace(SUPPORTED, "")
      .replace(/[_-]+/g, " ")
      // Split camel/pascal case runs so "SemiBoldItalic" reads as words.
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim() || "Untitled"
  );
}

const WEIGHT_HINTS: [RegExp, number][] = [
  [/thin|hairline/i, 100],
  [/extra ?light|ultra ?light/i, 200],
  [/light/i, 300],
  [/medium/i, 500],
  [/semi ?bold|demi ?bold/i, 600],
  [/extra ?bold|ultra ?bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700],
];

function weightFromName(name: string) {
  for (const [pattern, weight] of WEIGHT_HINTS) {
    if (pattern.test(name)) return weight;
  }
  return 400;
}

export interface UploadResult {
  fonts: FontItem[];
  rejected: string[];
}

/** Register one already-decoded face with the document. */
async function register(
  family: string,
  bytes: ArrayBuffer,
  weight: number,
  italic: boolean,
) {
  const face = new FontFace(family, bytes, {
    weight: String(weight),
    style: italic ? "italic" : "normal",
  });
  await face.load();
  document.fonts.add(face);
}

function toItem(family: string, weight: number, italic: boolean): FontItem {
  return {
    id: `custom:${family}`,
    family,
    source: "custom",
    category: "Other",
    weights: [weight],
    hasItalic: italic,
    axes: [],
    designers: [],
  };
}

/**
 * Re-register fonts saved in a previous session. Called once on startup.
 */
export async function restoreCustomFonts(): Promise<FontItem[]> {
  const stored = await loadStoredFonts();
  const items: FontItem[] = [];

  for (const font of stored) {
    try {
      // slice() because a FontFace takes ownership of the buffer it is given.
      await register(font.family, font.bytes.slice(0), font.weight, font.italic);
      items.push(toItem(font.family, font.weight, font.italic));
    } catch {
      // A file that no longer decodes is simply skipped.
    }
  }
  return items.sort((a, b) => a.family.localeCompare(b.family));
}

/**
 * Register dropped font files with the document. Everything happens in the
 * browser — the bytes are never uploaded anywhere — and a copy is kept in
 * IndexedDB so the fonts survive a reload.
 */
export async function loadCustomFonts(files: File[]): Promise<UploadResult> {
  const fonts: FontItem[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    if (!SUPPORTED.test(file.name)) {
      rejected.push(file.name);
      continue;
    }

    const family = familyFromFilename(file.name);
    const weight = weightFromName(file.name);
    const italic = /italic|oblique/i.test(file.name);

    try {
      const buffer = await file.arrayBuffer();
      await register(family, buffer.slice(0), weight, italic);

      const record: StoredFont = {
        family,
        weight,
        italic,
        bytes: buffer,
        addedAt: Date.now(),
      };
      await saveFont(record);

      fonts.push(toItem(family, weight, italic));
    } catch {
      // Corrupt file, or a format this browser cannot parse.
      rejected.push(file.name);
    }
  }

  return { fonts, rejected };
}
