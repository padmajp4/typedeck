"use client";

import { useEffect, useRef, useState } from "react";
import {
  fontFamilyValue,
  isStyleLoaded,
  loadFont,
  onFontLoaded,
  resolveWeight,
} from "@/lib/fontLoader";
import type { FontItem, PreviewSettings } from "@/lib/types";

interface Props {
  font: FontItem;
  settings: PreviewSettings;
  isFavorite: boolean;
  isSelected: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onToggleHidden: (id: string) => void;
}

const SOURCE_LABEL: Record<FontItem["source"], string> = {
  google: "Google",
  fontshare: "Fontshare",
  local: "Local",
  custom: "Uploaded",
};

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-[13px] transition-colors"
      style={{
        color: active ? "var(--accent)" : "var(--muted)",
        background: active ? "var(--accent-soft)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

export default function FontCard({
  font,
  settings,
  isFavorite,
  isSelected,
  onToggleFavorite,
  onToggleSelected,
  onToggleHidden,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  // Only preview a style the family actually ships, so nothing is synthesised.
  const weight = resolveWeight(font, settings.weight);
  const italic = settings.italic && font.hasItalic;

  const [ready, setReady] = useState(() => isStyleLoaded(font, weight, italic));

  // A weight or slant change means a different file, so re-check on every style.
  useEffect(() => {
    setReady(isStyleLoaded(font, weight, italic));
  }, [font, weight, italic]);

  // Request the webfont only once the card approaches the viewport.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadFont(font, weight, italic);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [font, weight, italic]);

  useEffect(() => {
    return onFontLoaded((key) => {
      if (key.startsWith(`${font.id}@`)) {
        setReady(isStyleLoaded(font, weight, italic));
      }
    });
  }, [font, weight, italic]);

  async function copyName() {
    try {
      await navigator.clipboard.writeText(font.family);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be blocked; the name is still visible on screen.
    }
  }

  return (
    <article
      ref={ref}
      className="group flex flex-col gap-3 rounded-xl border p-5 transition-colors"
      style={{
        borderColor: isSelected ? "var(--accent)" : "var(--line)",
        background: isSelected ? "var(--accent-soft)" : "var(--canvas)",
      }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-medium" title={font.family}>
            {font.family}
          </h2>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--muted)" }}>
            {SOURCE_LABEL[font.source]} · {font.category}
            {font.axes.length > 0 && " · Variable"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconButton label="Copy font name" onClick={copyName}>
            {copied ? "✓" : "⧉"}
          </IconButton>
          <IconButton
            label={isSelected ? "Deselect" : "Select for export"}
            active={isSelected}
            onClick={() => onToggleSelected(font.id)}
          >
            ◎
          </IconButton>
          <IconButton label="Hide this font" onClick={() => onToggleHidden(font.id)}>
            ⊘
          </IconButton>
          {font.downloadUrl && (
            <a
              href={font.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on the foundry site"
              aria-label={`Download ${font.family}`}
              className="grid h-7 w-7 place-items-center rounded-md text-[13px]"
              style={{ color: "var(--muted)" }}
            >
              ↓
            </a>
          )}
        </div>

        <IconButton
          label={isFavorite ? "Remove from favourites" : "Add to favourites"}
          active={isFavorite}
          onClick={() => onToggleFavorite(font.id)}
        >
          {isFavorite ? "★" : "☆"}
        </IconButton>
      </header>

      <p
        className={`preview-text${settings.colorsEnabled ? " rounded-lg p-4" : ""}`}
        style={{
          fontFamily: fontFamilyValue(font),
          fontSize: `${settings.size}px`,
          letterSpacing: `${settings.letterSpacing}em`,
          lineHeight: settings.lineHeight,
          fontWeight: weight,
          fontStyle: italic ? "italic" : "normal",
          opacity: ready ? 1 : 0.25,
          transition: "opacity 200ms ease",
          // Custom colours apply to the specimen only, so the card's own
          // labels stay legible whatever pair the user picks.
          ...(settings.colorsEnabled
            ? { color: settings.textColor, background: settings.bgColor }
            : null),
        }}
      >
        {settings.text || " "}
      </p>
    </article>
  );
}
