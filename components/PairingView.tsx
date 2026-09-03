"use client";

import { useEffect, useMemo, useState } from "react";
import { fontFamilyValue, loadFont, resolveWeight } from "@/lib/fontLoader";
import type { FontItem, PreviewSettings } from "@/lib/types";

const BODY_COPY = [
  "Typography is the craft of endowing human language with a durable visual form. A well-chosen pairing gives a page a voice before a single word is read.",
  "Look for contrast without conflict: the two faces should differ enough to signal hierarchy, yet share enough in proportion and rhythm to feel deliberate.",
];

/** A pairing needs a display face and a text face; these read well as defaults. */
const SEED_HEADING = ["Playfair Display", "Poppins", "Space Grotesk", "Bricolage Grotesque"];
const SEED_BODY = ["Inter", "Source Sans 3", "Lora", "IBM Plex Sans"];

function FontSelect({
  label,
  fonts,
  value,
  onChange,
}: {
  label: string;
  fonts: FontItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
        style={{ borderColor: "var(--line)", background: "var(--canvas)", color: "var(--ink)" }}
      >
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {font.family}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PairingView({
  fonts,
  settings,
  headingId,
  bodyId,
  onChangeHeading,
  onChangeBody,
}: {
  fonts: FontItem[];
  settings: PreviewSettings;
  headingId: string | null;
  bodyId: string | null;
  onChangeHeading: (id: string) => void;
  onChangeBody: (id: string) => void;
}) {
  const [headingScale, setHeadingScale] = useState(1);

  // Fall back to a sensible seed pair until the user picks their own.
  const heading = useMemo(() => {
    const byId = fonts.find((f) => f.id === headingId);
    if (byId) return byId;
    return (
      SEED_HEADING.map((name) => fonts.find((f) => f.family === name)).find(Boolean) ?? fonts[0]
    );
  }, [fonts, headingId]);

  const body = useMemo(() => {
    const byId = fonts.find((f) => f.id === bodyId);
    if (byId) return byId;
    return (
      SEED_BODY.map((name) => fonts.find((f) => f.family === name)).find(Boolean) ?? fonts[1] ?? fonts[0]
    );
  }, [fonts, bodyId]);

  // Load the exact cuts the specimen renders in.
  useEffect(() => {
    if (heading) loadFont(heading, resolveWeight(heading, 700), false);
    if (body) {
      loadFont(body, resolveWeight(body, 400), false);
      loadFont(body, resolveWeight(body, 600), false);
    }
  }, [heading, body]);

  if (!heading || !body) {
    return (
      <p className="p-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
        Loading font catalogues…
      </p>
    );
  }

  function shuffle() {
    const pick = () => fonts[Math.floor(Math.random() * fonts.length)];
    onChangeHeading(pick().id);
    onChangeBody(pick().id);
  }

  function swap() {
    onChangeHeading(body!.id);
    onChangeBody(heading!.id);
  }

  const ink = settings.colorsEnabled ? settings.textColor : "var(--ink)";
  const paper = settings.colorsEnabled ? settings.bgColor : "var(--canvas)";
  const headingSize = Math.round(settings.size * 1.25 * headingScale);
  const bodySize = Math.max(13, Math.round(settings.size * 0.42));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div
        className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <FontSelect label="Heading" fonts={fonts} value={heading.id} onChange={onChangeHeading} />
        <FontSelect label="Body" fonts={fonts} value={body.id} onChange={onChangeBody} />

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Scale
          </span>
          <input
            type="range"
            min={0.6}
            max={2}
            step={0.05}
            value={headingScale}
            onChange={(e) => setHeadingScale(Number(e.target.value))}
            aria-label="Heading scale"
            className="h-1 w-24 cursor-pointer"
          />
        </label>

        <button
          type="button"
          onClick={swap}
          className="rounded-lg border px-2.5 py-1.5 text-[12px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          Swap
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          Shuffle
        </button>
      </div>

      <article
        className="rounded-xl border p-8 sm:p-12"
        style={{ borderColor: "var(--line)", background: paper, color: ink }}
      >
        <p
          className="mb-3 text-[12px] uppercase tracking-[0.18em]"
          style={{
            fontFamily: fontFamilyValue(body),
            fontWeight: resolveWeight(body, 600),
            opacity: 0.6,
          }}
        >
          Specimen
        </p>

        <h2
          className="preview-text mb-5"
          style={{
            fontFamily: fontFamilyValue(heading),
            fontSize: `${headingSize}px`,
            fontWeight: resolveWeight(heading, 700),
            lineHeight: settings.lineHeight * 0.85,
            letterSpacing: `${settings.letterSpacing - 0.015}em`,
          }}
        >
          {settings.text || "The quick brown fox"}
        </h2>

        {BODY_COPY.map((paragraph) => (
          <p
            key={paragraph}
            className="preview-text mb-4 max-w-[62ch]"
            style={{
              fontFamily: fontFamilyValue(body),
              fontSize: `${bodySize}px`,
              fontWeight: resolveWeight(body, 400),
              lineHeight: Math.max(1.45, settings.lineHeight),
            }}
          >
            {paragraph}
          </p>
        ))}

        <p
          className="mt-6 border-t pt-3 text-[12px]"
          style={{
            fontFamily: fontFamilyValue(body),
            borderColor: "currentColor",
            opacity: 0.5,
          }}
        >
          {heading.family} + {body.family}
        </p>
      </article>
    </div>
  );
}
