"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CANVASES,
  CANVAS_LABELS,
  CANVAS_TOKENS,
  TEMPLATES,
  TEMPLATE_LABELS,
  TemplatePreview,
  type Canvas,
  type Template,
} from "./PairingTemplates";
import { fontFamilyValue, loadFont, resolveWeight } from "@/lib/fontLoader";
import type { FontItem, PreviewSettings } from "@/lib/types";

/** A display face and a text face read well as an opening pair. */
const SEED_HEADING = ["Playfair Display", "Fraunces", "Instrument Serif", "Poppins"];
const SEED_BODY = ["Inter", "Source Sans 3", "IBM Plex Sans", "Lato"];

const RADII = [0, 8, 16, 24];

export interface PairingState {
  template: Template;
  canvas: Canvas;
  radius: number;
  headingSize: number;
  bodySize: number;
}

export const DEFAULT_PAIRING: PairingState = {
  template: "hero",
  canvas: "paper",
  radius: 16,
  headingSize: 46,
  bodySize: 16,
};

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: "var(--surface)" }}
    >
      {children}
    </div>
  );
}

function Toggle<T extends string | number>({
  value,
  current,
  onClick,
  children,
}: {
  value: T;
  current: T;
  onClick: (value: T) => void;
  children: React.ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={active}
      className="rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors"
      style={{
        background: active ? "var(--canvas)" : "transparent",
        color: active ? "var(--ink)" : "var(--muted)",
        boxShadow: active ? "0 1px 2px rgb(0 0 0 / 0.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}

/** A font picker with its own size stepper, used for both roles. */
function RolePicker({
  role,
  fonts,
  value,
  size,
  min,
  max,
  onChangeFont,
  onChangeSize,
}: {
  role: string;
  fonts: FontItem[];
  value: string;
  size: number;
  min: number;
  max: number;
  onChangeFont: (id: string) => void;
  onChangeSize: (size: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border py-1 pl-2.5 pr-1"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {role}
      </span>
      <select
        value={value}
        onChange={(e) => onChangeFont(e.target.value)}
        aria-label={`${role} font`}
        className="max-w-[150px] bg-transparent text-[13px] outline-none"
        style={{ color: "var(--ink)" }}
      >
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {font.family}
          </option>
        ))}
      </select>
      <label
        className="flex items-center gap-1 rounded-md px-2 py-1"
        style={{ background: "var(--surface)" }}
      >
        <span className="sr-only">{role} size in pixels</span>
        <input
          type="number"
          min={min}
          max={max}
          value={size}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(next)) onChangeSize(Math.min(max, Math.max(min, next)));
          }}
          aria-label={`${role} size in pixels`}
          className="w-9 bg-transparent text-right text-[12px] tabular-nums outline-none"
          style={{ color: "var(--ink)" }}
        />
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>
          px
        </span>
      </label>
    </div>
  );
}

export default function PairingView({
  fonts,
  settings,
  headingId,
  bodyId,
  pairing,
  onChangeHeading,
  onChangeBody,
  onChangePairing,
}: {
  fonts: FontItem[];
  settings: PreviewSettings;
  headingId: string | null;
  bodyId: string | null;
  pairing: PairingState;
  onChangeHeading: (id: string) => void;
  onChangeBody: (id: string) => void;
  onChangePairing: (patch: Partial<PairingState>) => void;
}) {
  const [copied, setCopied] = useState(false);

  const heading = useMemo(() => {
    const byId = fonts.find((f) => f.id === headingId);
    if (byId) return byId;
    return SEED_HEADING.map((n) => fonts.find((f) => f.family === n)).find(Boolean) ?? fonts[0];
  }, [fonts, headingId]);

  const body = useMemo(() => {
    const byId = fonts.find((f) => f.id === bodyId);
    if (byId) return byId;
    return (
      SEED_BODY.map((n) => fonts.find((f) => f.family === n)).find(Boolean) ??
      fonts[1] ??
      fonts[0]
    );
  }, [fonts, bodyId]);

  // Load exactly the cuts the mock renders in.
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

  const headingWeight = resolveWeight(heading, 700);
  const bodyWeight = resolveWeight(body, 400);

  function surprise() {
    const pick = () => fonts[Math.floor(Math.random() * fonts.length)];
    onChangeHeading(pick().id);
    onChangeBody(pick().id);
  }

  function swap() {
    onChangeHeading(body!.id);
    onChangeBody(heading!.id);
  }

  async function copyPairCss() {
    const googleFamilies = [
      heading!.source === "google"
        ? `family=${encodeURIComponent(heading!.family)}:wght@${headingWeight}`
        : null,
      body!.source === "google"
        ? `family=${encodeURIComponent(body!.family)}:wght@${bodyWeight};600`
        : null,
    ].filter(Boolean);

    const importRule = googleFamilies.length
      ? `@import url("https://fonts.googleapis.com/css2?${googleFamilies.join("&")}&display=swap");\n\n`
      : "";

    const css = `${importRule}:root {
  --font-heading: ${fontFamilyValue(heading!)};
  --font-body: ${fontFamilyValue(body!)};
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: ${headingWeight};
  font-size: ${pairing.headingSize}px;
  letter-spacing: ${(settings.letterSpacing - 0.015).toFixed(3)}em;
  line-height: ${(settings.lineHeight * 0.82).toFixed(2)};
}

body {
  font-family: var(--font-body);
  font-weight: ${bodyWeight};
  font-size: ${pairing.bodySize}px;
  line-height: ${Math.max(1.45, settings.lineHeight).toFixed(2)};
}`;

    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; nothing else to do here.
    }
  }

  const tokens = CANVAS_TOKENS[pairing.canvas];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <RolePicker
          role="Heading"
          fonts={fonts}
          value={heading.id}
          size={pairing.headingSize}
          min={16}
          max={140}
          onChangeFont={onChangeHeading}
          onChangeSize={(headingSize) => onChangePairing({ headingSize })}
        />
        <button
          type="button"
          onClick={swap}
          title="Swap the two faces"
          className="rounded-lg border px-2.5 py-2 text-[12px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          ⇄
        </button>
        <RolePicker
          role="Body"
          fonts={fonts}
          value={body.id}
          size={pairing.bodySize}
          min={10}
          max={40}
          onChangeFont={onChangeBody}
          onChangeSize={(bodySize) => onChangePairing({ bodySize })}
        />
        <button
          type="button"
          onClick={surprise}
          className="rounded-lg px-3 py-2 text-[12px] font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Surprise me
        </button>

        <button
          type="button"
          onClick={copyPairCss}
          className="ml-auto rounded-lg px-3 py-2 text-[12px] font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {copied ? "CSS copied" : "Copy pair CSS"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Layout
        </span>
        <Group>
          {TEMPLATES.map((t) => (
            <Toggle
              key={t}
              value={t}
              current={pairing.template}
              onClick={(template) => onChangePairing({ template })}
            >
              {TEMPLATE_LABELS[t]}
            </Toggle>
          ))}
        </Group>

        <span className="ml-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Canvas
        </span>
        <Group>
          {CANVASES.map((c) => (
            <Toggle
              key={c}
              value={c}
              current={pairing.canvas}
              onClick={(canvas) => onChangePairing({ canvas })}
            >
              {CANVAS_LABELS[c]}
            </Toggle>
          ))}
        </Group>

        <span className="ml-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Radius
        </span>
        <Group>
          {RADII.map((r) => (
            <Toggle
              key={r}
              value={r}
              current={pairing.radius}
              onClick={(radius) => onChangePairing({ radius })}
            >
              {r}
            </Toggle>
          ))}
        </Group>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: "var(--line)",
          background: tokens.bg,
          boxShadow: "0 1px 3px rgb(0 0 0 / 0.06), 0 12px 32px rgb(0 0 0 / 0.06)",
        }}
      >
        <TemplatePreview
          template={pairing.template}
          headingFamily={fontFamilyValue(heading)}
          bodyFamily={fontFamilyValue(body)}
          headingSize={pairing.headingSize}
          bodySize={pairing.bodySize}
          headingWeight={headingWeight}
          bodyWeight={bodyWeight}
          letterSpacing={settings.letterSpacing}
          lineHeight={settings.lineHeight}
          radius={pairing.radius}
          tokens={tokens}
          headline={settings.text || "Build interfaces at the speed of thought"}
        />
      </div>

      <p className="text-center text-[12px]" style={{ color: "var(--muted)" }}>
        {heading.family} <span style={{ opacity: 0.5 }}>+</span> {body.family}
      </p>
    </div>
  );
}
