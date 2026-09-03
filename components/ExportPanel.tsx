"use client";

import { useMemo, useState } from "react";
import type { PreviewSettings } from "./FontCard";
import { fontFamilyValue } from "@/lib/fontLoader";
import type { FontItem } from "@/lib/types";

type Format = "css" | "html" | "list";

function googleLink(fonts: FontItem[]) {
  const families = fonts
    .filter((f) => f.source === "google")
    .map((f) => `family=${f.family.replace(/ /g, "+")}:wght@400;700`);
  if (!families.length) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

function buildCss(fonts: FontItem[], settings: PreviewSettings) {
  const link = googleLink(fonts);
  const importRule = link ? `@import url("${link}");\n\n` : "";
  const rules = fonts
    .map(
      (font) => `.font-${font.family.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {
  font-family: ${fontFamilyValue(font)};
  font-size: ${settings.size}px;
  letter-spacing: ${settings.letterSpacing}em;
  line-height: ${settings.lineHeight};
  font-weight: ${settings.weight};
}`,
    )
    .join("\n\n");
  return importRule + rules;
}

function buildHtml(fonts: FontItem[], settings: PreviewSettings) {
  const link = googleLink(fonts);
  const head = link ? `<link rel="stylesheet" href="${link}">\n\n` : "";
  const body = fonts
    .map(
      (font) =>
        `<p style="font-family: ${fontFamilyValue(font)}; font-size: ${settings.size}px; letter-spacing: ${settings.letterSpacing}em; line-height: ${settings.lineHeight}; font-weight: ${settings.weight};">${settings.text}</p>`,
    )
    .join("\n");
  return head + body;
}

export default function ExportPanel({
  fonts,
  settings,
  onClose,
}: {
  fonts: FontItem[];
  settings: PreviewSettings;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<Format>("css");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    if (format === "css") return buildCss(fonts, settings);
    if (format === "html") return buildHtml(fonts, settings);
    return fonts.map((f) => f.family).join("\n");
  }, [format, fonts, settings]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be blocked; the code stays selectable in the textarea.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgb(0 0 0 / 0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Export selected fonts"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col gap-3 rounded-xl border p-4"
        style={{ background: "var(--canvas)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold">
            Export {fonts.length} font{fonts.length === 1 ? "" : "s"}
          </h2>
          <div className="ml-auto flex gap-1">
            {(["css", "html", "list"] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className="rounded-md px-2.5 py-1 text-[12px] uppercase"
                style={{
                  background: format === f ? "var(--accent-soft)" : "var(--surface)",
                  color: format === f ? "var(--accent)" : "var(--muted)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <textarea
          readOnly
          value={code}
          aria-label="Generated code"
          className="scroll-thin h-72 w-full resize-none rounded-lg border p-3 font-mono text-[12px] outline-none"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-[12px]"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
