"use client";

import { useEffect, useState } from "react";
import { assessContrast } from "@/lib/contrast";
import type { PreviewSettings } from "@/lib/types";

const HEX = /^#?([0-9a-fA-F]{6})$/;

/** A native colour swatch paired with a directly-editable hex field. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // A local draft, so a user can freely clear and retype a hex code without
  // every partial keystroke needing to already be a valid colour.
  const [draft, setDraft] = useState(value);

  // Stay in sync with changes from elsewhere — the native picker, Swap, or a
  // permalink restoring a shared view — without clobbering an in-progress edit.
  useEffect(() => setDraft(value), [value]);

  function commit(raw: string) {
    const match = raw.match(HEX);
    if (match) onChange(`#${match[1].toLowerCase()}`);
  }

  return (
    <span className="flex items-center gap-1">
      <label className="flex items-center" title={label}>
        <span className="sr-only">{label}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="h-6 w-6 cursor-pointer rounded border bg-transparent p-0"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit(draft);
          // An invalid or partial entry snaps back to the last real colour
          // rather than leaving something broken-looking behind.
          setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label={`${label} hex code`}
        spellCheck={false}
        maxLength={7}
        className="w-[64px] rounded-md border px-1.5 py-1 font-mono text-[12px] uppercase outline-none"
        style={{ borderColor: "var(--line)", background: "var(--canvas)", color: "var(--ink)" }}
      />
    </span>
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
          <ColorField
            label="Text colour"
            value={settings.textColor}
            onChange={(v) => onChange("textColor", v)}
          />
          <ColorField
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
