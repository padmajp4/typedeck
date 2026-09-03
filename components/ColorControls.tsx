"use client";

import { assessContrast } from "@/lib/contrast";
import type { PreviewSettings } from "@/lib/types";

function Swatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5" title={label}>
      <span className="sr-only">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-6 w-6 cursor-pointer rounded border bg-transparent p-0"
        style={{ borderColor: "var(--line)" }}
      />
    </label>
  );
}

/**
 * Text and background colour pickers plus a live WCAG readout, so legibility
 * can be judged at the same time as the typeface.
 */
export default function ColorControls({
  settings,
  onChange,
}: {
  settings: PreviewSettings;
  onChange: <K extends keyof PreviewSettings>(key: K, value: PreviewSettings[K]) => void;
}) {
  const verdict = assessContrast(
    settings.textColor,
    settings.bgColor,
    settings.size,
    settings.weight,
  );

  const badgeColor =
    verdict?.level === "Fail"
      ? "#b42318"
      : verdict?.level === "AAA"
        ? "#067647"
        : "#b54708";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("colorsEnabled", !settings.colorsEnabled)}
        aria-pressed={settings.colorsEnabled}
        className="rounded-lg px-2.5 py-1 text-[12px]"
        style={{
          background: settings.colorsEnabled ? "var(--accent-soft)" : "var(--surface)",
          color: settings.colorsEnabled ? "var(--accent)" : "var(--muted)",
        }}
      >
        Colours
      </button>

      {settings.colorsEnabled && (
        <>
          <Swatch
            label="Text colour"
            value={settings.textColor}
            onChange={(v) => onChange("textColor", v)}
          />
          <Swatch
            label="Background colour"
            value={settings.bgColor}
            onChange={(v) => onChange("bgColor", v)}
          />
          <button
            type="button"
            onClick={() => {
              onChange("textColor", settings.bgColor);
              onChange("bgColor", settings.textColor);
            }}
            title="Swap text and background"
            aria-label="Swap text and background colours"
            className="rounded-md px-1.5 py-1 text-[12px]"
            style={{ color: "var(--muted)" }}
          >
            ⇄
          </button>

          {verdict && (
            <span
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
              style={{ background: `${badgeColor}1a`, color: badgeColor }}
              title={`WCAG ${verdict.level} at this size and weight${
                verdict.large ? " (counts as large text)" : ""
              }`}
            >
              {verdict.ratio.toFixed(2)}:1 {verdict.level}
            </span>
          )}
        </>
      )}
    </div>
  );
}
