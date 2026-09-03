import { loadFont, resolveWeight } from "./fontLoader";
import type { FontItem, PreviewSettings } from "./types";

/**
 * Prints the current PrintSheet (rendered off-screen, revealed by
 * @media print). A selected font may never have scrolled into view, so its
 * webfont might not be loaded yet — printing too early would come out in a
 * fallback face, so every family is loaded and awaited first.
 */
export async function printSpecimen(fonts: FontItem[], settings: PreviewSettings) {
  for (const font of fonts) loadFont(font, resolveWeight(font, settings.weight), settings.italic);
  try {
    await Promise.all(
      fonts.map((font) =>
        document.fonts.load(
          `${resolveWeight(font, settings.weight)} 32px "${font.family.replace(/"/g, "")}"`,
        ),
      ),
    );
  } catch {
    // Print anyway; at worst a family falls back.
  }
  window.print();
}
