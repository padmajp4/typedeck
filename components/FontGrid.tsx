"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import FontCard from "./FontCard";
import type { FontItem, PreviewSettings } from "@/lib/types";

export const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

interface Props {
  fonts: FontItem[];
  columns: number;
  settings: PreviewSettings;
  favoriteIds: Set<string>;
  selectedIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onOpenGlyphs: (font: FontItem) => void;
}

/**
 * A rough first guess at a row's height, before it has actually been
 * measured. Only affects scrollbar sizing and where a not-yet-rendered row
 * lands until it is; the real height, once mounted, is measured and the
 * estimate corrected automatically.
 */
function estimateRowHeight(settings: PreviewSettings) {
  const header = 56; // family name + source/category line
  const previewLines = 2; // a reasonable average across typical sample text
  const preview = settings.size * settings.lineHeight * previewLines;
  const cardPadding = 40; // p-5 top + bottom
  const rowGap = 12;
  return Math.round(header + preview + cardPadding + rowGap);
}

/**
 * Renders the font grid with DOM virtualization: only rows near the viewport
 * are actually mounted, regardless of how many fonts match the current
 * filters. Without this, scrolling through a meaningful chunk of a
 * 2,000+-font catalogue keeps every card that was ever scrolled past in the
 * DOM permanently — confirmed via CDP metrics to reach 100,000+ nodes and
 * cause 1-second-plus dropped frames after extended scrolling.
 *
 * Cards vary in height (font size, wrapped sample text, selected columns),
 * so rows are dynamically measured rather than assumed uniform.
 */
export default function FontGrid({
  fonts,
  columns,
  settings,
  favoriteIds,
  selectedIds,
  onToggleFavorite,
  onToggleSelected,
  onToggleHidden,
  onOpenGlyphs,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cols = COLUMN_CLASS[columns] ? columns : 2;

  const rows = useMemo(() => {
    const grouped: FontItem[][] = [];
    for (let i = 0; i < fonts.length; i += cols) grouped.push(fonts.slice(i, i + cols));
    return grouped;
  }, [fonts, cols]);

  // The grid can sit at a different distance from the top of the page — the
  // local-fonts banner appears and disappears above it, and the header can
  // wrap to a different height — so this is kept live rather than measured
  // once on mount.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (containerRef.current) setScrollMargin(containerRef.current.offsetTop);
  });

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => estimateRowHeight(settings),
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => rows[index]?.[0]?.id ?? index,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={containerRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
      {items.map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={virtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${row.start - scrollMargin}px)`,
          }}
        >
          <div className={`grid gap-3 pb-3 ${COLUMN_CLASS[cols]}`}>
            {rows[row.index].map((font) => (
              <FontCard
                key={font.id}
                font={font}
                settings={settings}
                isFavorite={favoriteIds.has(font.id)}
                isSelected={selectedIds.has(font.id)}
                onToggleFavorite={onToggleFavorite}
                onToggleSelected={onToggleSelected}
                onToggleHidden={onToggleHidden}
                onOpenGlyphs={onOpenGlyphs}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
