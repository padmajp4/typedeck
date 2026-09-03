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

/**
 * Register dropped font files with the document. Everything happens in the
 * browser — the bytes are never uploaded anywhere. Registrations last for the
 * session only, since we deliberately keep no copy of the file.
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
      const face = new FontFace(family, buffer, {
        weight: String(weight),
        style: italic ? "italic" : "normal",
      });
      await face.load();
      document.fonts.add(face);

      fonts.push({
        id: `custom:${family}`,
        family,
        source: "custom",
        category: "Other",
        weights: [weight],
        hasItalic: italic,
        axes: [],
        designers: [],
      });
    } catch {
      // Corrupt file, or a format this browser cannot parse.
      rejected.push(file.name);
    }
  }

  return { fonts, rejected };
}
