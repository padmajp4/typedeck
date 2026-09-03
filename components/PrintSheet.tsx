"use client";

import { fontFamilyValue, resolveWeight } from "@/lib/fontLoader";
import { TEXT_TRANSFORM, type FontItem, type PreviewSettings } from "@/lib/types";

/**
 * A paginated specimen of the chosen fonts. Hidden on screen and revealed by
 * the print stylesheet, so what prints is a clean sheet rather than a capture
 * of the running app.
 */
export default function PrintSheet({
  fonts,
  settings,
}: {
  fonts: FontItem[];
  settings: PreviewSettings;
}) {
  if (!fonts.length) return null;

  return (
    <div className="print-sheet" aria-hidden="true">
      <div style={{ borderBottom: "2px solid #000", paddingBottom: "8pt", marginBottom: "4pt" }}>
        <h1 style={{ fontSize: "16pt", fontWeight: 700, margin: 0 }}>Font specimen</h1>
        <p style={{ fontSize: "9pt", color: "#555", margin: "3pt 0 0" }}>
          {fonts.length} font{fonts.length === 1 ? "" : "s"} ·{" "}
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · typedeck.padmajp.com
        </p>
      </div>

      {fonts.map((font) => (
        <section key={font.id} className="print-specimen">
          <p style={{ fontSize: "9pt", color: "#555", margin: "0 0 6pt" }}>
            <strong style={{ color: "#000", fontSize: "10pt" }}>{font.family}</strong>
            {"  ·  "}
            {font.category}
            {font.designers.length > 0 && `  ·  ${font.designers.join(", ")}`}
          </p>
          <p
            style={{
              fontFamily: fontFamilyValue(font),
              fontSize: `${settings.size}px`,
              letterSpacing: `${settings.letterSpacing}em`,
              lineHeight: settings.lineHeight,
              fontWeight: resolveWeight(font, settings.weight),
              fontStyle: settings.italic && font.hasItalic ? "italic" : "normal",
              textTransform: TEXT_TRANSFORM[settings.textCase],
              margin: 0,
              overflowWrap: "anywhere",
            }}
          >
            {settings.text}
          </p>
        </section>
      ))}
    </div>
  );
}
