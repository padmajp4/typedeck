"use client";

import { useEffect, useMemo, useState } from "react";
import { fontFamilyValue, loadFont, resolveWeight } from "@/lib/fontLoader";
import type { FontItem } from "@/lib/types";

function range(from: string, to: string) {
  const out: string[] = [];
  for (let c = from.codePointAt(0)!; c <= to.codePointAt(0)!; c++) {
    out.push(String.fromCodePoint(c));
  }
  return out;
}

const SETS: { label: string; chars: string[] }[] = [
  { label: "Uppercase", chars: range("A", "Z") },
  { label: "Lowercase", chars: range("a", "z") },
  { label: "Numerals", chars: range("0", "9") },
  {
    label: "Punctuation",
    chars: [...".,:;!?¡¿'\"‘’“”«»‹›-–—_()[]{}/\\|&@#*†‡•·…"],
  },
  { label: "Symbols", chars: [..."$€£¥¢₹+−×÷=≠<>≤≥%‰°^~≈∞µ©®™§¶"] },
  { label: "Accented", chars: [..."ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŒßàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿœ"] },
];

/**
 * Detects which characters the face actually draws, by rendering each one with
 * two different fallbacks. If the font supplies the glyph, both measurements
 * use it and match. If it does not, one falls back to monospace and the other
 * to serif, and the widths diverge.
 */
function useCoverage(font: FontItem, ready: boolean) {
  return useMemo(() => {
    if (typeof document === "undefined" || !ready) return null;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;

    const family = font.family.replace(/"/g, "");
    const missing = new Set<string>();

    for (const set of SETS) {
      for (const char of set.chars) {
        ctx.font = `64px "${family}", monospace`;
        const viaMono = ctx.measureText(char).width;
        ctx.font = `64px "${family}", serif`;
        const viaSerif = ctx.measureText(char).width;
        if (Math.abs(viaMono - viaSerif) > 0.01) missing.add(char);
      }
    }
    return missing;
  }, [font, ready]);
}

export default function GlyphMap({ font, onClose }: { font: FontItem; onClose: () => void }) {
  const [size, setSize] = useState(44);
  const [copied, setCopied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const weight = resolveWeight(font, 400);

  useEffect(() => {
    loadFont(font, weight, false);
    // Wait for the face before measuring coverage, or everything reads as missing.
    let cancelled = false;
    const family = font.family.replace(/"/g, "");
    document.fonts
      .load(`${weight} 64px "${family}"`)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [font, weight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const missing = useCoverage(font, ready);

  async function copyGlyph(char: string) {
    try {
      await navigator.clipboard.writeText(char);
      setCopied(char);
      setTimeout(() => setCopied(null), 1000);
    } catch {
      // Clipboard can be blocked; the glyph is still on screen.
    }
  }

  const total = SETS.reduce((n, s) => n + s.chars.length, 0);
  const supported = missing ? total - missing.size : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(0 0 0 / 0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Character set for ${font.family}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border"
        style={{ background: "var(--canvas)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold">{font.family}</h2>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {supported === null
                ? "Checking coverage…"
                : `${supported} of ${total} characters in this set`}
            </p>
          </div>

          <label
            className="ml-auto flex items-center gap-2 text-[12px]"
            style={{ color: "var(--muted)" }}
          >
            <span>Size</span>
            <input
              type="range"
              min={24}
              max={96}
              step={2}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label="Glyph size"
              className="h-1 w-24 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close character map"
            className="grid h-7 w-7 place-items-center rounded-md text-[15px]"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </header>

        <div className="scroll-thin overflow-y-auto p-4">
          {SETS.map((set) => {
            const chars = set.chars.filter((c) => !missing?.has(c));
            if (missing && chars.length === 0) return null;
            return (
              <section key={set.label} className="mb-6">
                <h3
                  className="mb-2 text-[11px] font-medium uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  {set.label}
                  <span style={{ opacity: 0.6 }}> · {chars.length}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {chars.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => copyGlyph(char)}
                      title={`Copy ${char} (U+${char
                        .codePointAt(0)!
                        .toString(16)
                        .toUpperCase()
                        .padStart(4, "0")})`}
                      className="grid place-items-center rounded-lg border transition-colors"
                      style={{
                        width: size * 1.35,
                        height: size * 1.35,
                        borderColor: copied === char ? "var(--accent)" : "var(--line)",
                        background: copied === char ? "var(--accent-soft)" : "transparent",
                        fontFamily: fontFamilyValue(font),
                        fontSize: size,
                        fontWeight: weight,
                        lineHeight: 1,
                        color: "var(--ink)",
                      }}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer
          className="border-t px-4 py-2 text-[11px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          {copied ? `Copied “${copied}” to the clipboard` : "Click any glyph to copy it"}
        </footer>
      </div>
    </div>
  );
}
