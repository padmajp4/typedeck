"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FontCard, { type PreviewSettings } from "./FontCard";
import ExportPanel from "./ExportPanel";
import { Chip, NumberField, Segmented } from "./ui";
import { queryLocalFonts, supportsLocalFonts } from "@/lib/localFonts";
import { usePersistentSet, usePersistentState } from "@/lib/useStore";
import { CATEGORIES, type FontCategory, type FontItem } from "@/lib/types";

type SourceTab =
  | "all"
  | "local"
  | "google"
  | "fontshare"
  | "favorites"
  | "selected"
  | "hidden";

type SortMode = "az" | "za" | "popular" | "recent" | "random";

const DEFAULT_SETTINGS: PreviewSettings = {
  text: "The quick brown fox jumps over the lazy dog",
  size: 48,
  letterSpacing: 0,
  lineHeight: 1.3,
  weight: 400,
  italic: false,
};

/** How many cards to add each time the infinite-scroll sentinel appears. */
const PAGE_SIZE = 48;

const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

/** Deterministic shuffle so "Random" stays stable until explicitly reshuffled. */
function shuffle<T>(items: T[], seed: number) {
  const result = [...items];
  let state = seed || 1;
  for (let i = result.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TypeScope() {
  const [remoteFonts, setRemoteFonts] = useState<FontItem[]>([]);
  const [localFonts, setLocalFonts] = useState<FontItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [settings, setSettings] = usePersistentState<PreviewSettings>(
    "settings",
    DEFAULT_SETTINGS,
  );
  const [tab, setTab] = useState<SourceTab>("all");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = usePersistentState<SortMode>("sort", "popular");
  const [columns, setColumns] = usePersistentState<number>("columns", 2);
  const [theme, setTheme] = usePersistentState<"light" | "dark">("theme", "light");
  const [seed, setSeed] = useState(1);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showExport, setShowExport] = useState(false);

  const [scrollSpeed, setScrollSpeed] = useState(0);
  // Feature detection must run after mount so SSR and hydration agree.
  const [canUseLocalFonts, setCanUseLocalFonts] = useState(false);

  const favorites = usePersistentSet("favorites");
  const selected = usePersistentSet("selected");
  const hidden = usePersistentSet("hidden");

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch both remote catalogues in parallel; either may fail independently.
  useEffect(() => {
    let cancelled = false;

    async function fetchSource(url: string) {
      const res = await fetch(url);
      const data = (await res.json()) as { fonts: FontItem[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request to ${url} failed`);
      return data.fonts;
    }

    Promise.allSettled([
      fetchSource("/api/google-fonts"),
      fetchSource("/api/fontshare"),
    ]).then((results) => {
      if (cancelled) return;
      const fonts = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      if (!fonts.length) {
        const reason = results.find((r) => r.status === "rejected");
        setLoadError(
          reason && reason.status === "rejected"
            ? String(reason.reason)
            : "Could not load any font catalogues.",
        );
      }
      setRemoteFonts(fonts);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const allFonts = useMemo(
    () => [...localFonts, ...remoteFonts],
    [localFonts, remoteFonts],
  );

  async function grantLocalFonts() {
    setLocalError(null);
    try {
      const fonts = await queryLocalFonts();
      if (!fonts.length) setLocalError("No local fonts were returned.");
      setLocalFonts(fonts);
      setTab("local");
    } catch {
      setLocalError("Permission denied. Allow font access to browse installed fonts.");
    }
  }

  const counts = useMemo(
    () => ({
      all: allFonts.filter((f) => !hidden.set.has(f.id)).length,
      local: localFonts.length,
      google: remoteFonts.filter((f) => f.source === "google").length,
      fontshare: remoteFonts.filter((f) => f.source === "fontshare").length,
      favorites: favorites.count,
      selected: selected.count,
      hidden: hidden.count,
    }),
    [allFonts, localFonts, remoteFonts, favorites.count, selected.count, hidden.count, hidden.set],
  );

  const fonts = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = allFonts.filter((font) => {
      switch (tab) {
        case "favorites":
          return favorites.set.has(font.id);
        case "selected":
          return selected.set.has(font.id);
        case "hidden":
          return hidden.set.has(font.id);
        case "local":
        case "google":
        case "fontshare":
          return font.source === tab && !hidden.set.has(font.id);
        default:
          return !hidden.set.has(font.id);
      }
    });

    if (category !== "all") list = list.filter((f) => f.category === category);
    if (query) {
      list = list.filter(
        (f) =>
          f.family.toLowerCase().includes(query) ||
          f.designers.some((d) => d.toLowerCase().includes(query)),
      );
    }

    switch (sort) {
      case "az":
        return [...list].sort((a, b) => a.family.localeCompare(b.family));
      case "za":
        return [...list].sort((a, b) => b.family.localeCompare(a.family));
      case "recent":
        return [...list].sort((a, b) => (b.dateAdded ?? "").localeCompare(a.dateAdded ?? ""));
      case "random":
        return shuffle(list, seed);
      default:
        // Local fonts have no popularity rank, so they sort alphabetically last.
        return [...list].sort(
          (a, b) => (a.popularity ?? Infinity) - (b.popularity ?? Infinity) ||
            a.family.localeCompare(b.family),
        );
    }
  }, [allFonts, tab, category, search, sort, seed, favorites.set, selected.set, hidden.set]);

  // Reset the render window whenever the result set changes.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [tab, category, search, sort, seed]);

  // Infinite scroll: reveal another page when the sentinel comes into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((current) => Math.min(current + PAGE_SIZE, fonts.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fonts.length]);

  useEffect(() => {
    setCanUseLocalFonts(supportsLocalFonts());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Auto-scroll the page at the chosen speed, pausing at the bottom.
  useEffect(() => {
    if (scrollSpeed <= 0) return;
    let frame = 0;
    const step = () => {
      const atBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 2;
      if (atBottom) setScrollSpeed(0);
      else window.scrollBy(0, scrollSpeed);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [scrollSpeed]);

  const update = useCallback(
    <K extends keyof PreviewSettings>(key: K, value: PreviewSettings[K]) =>
      setSettings((current) => ({ ...current, [key]: value })),
    [setSettings],
  );

  const selectedFonts = useMemo(
    () => allFonts.filter((f) => selected.set.has(f.id)),
    [allFonts, selected.set],
  );

  const shown = fonts.slice(0, visible);

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--canvas) 88%, transparent)" }}
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-[15px] font-semibold tracking-tight">TypeScope</h1>

          <input
            value={settings.text}
            onChange={(e) => update("text", e.target.value)}
            placeholder="Type to preview…"
            aria-label="Preview text"
            className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-[13px] outline-none"
            style={{ borderColor: "var(--line)", background: "var(--canvas)", color: "var(--ink)" }}
          />

          <NumberField
            label="Size"
            value={settings.size}
            min={8}
            max={200}
            step={1}
            onChange={(v) => update("size", v)}
          />
          <NumberField
            label="Spacing"
            value={settings.letterSpacing}
            min={-0.1}
            max={0.5}
            step={0.005}
            onChange={(v) => update("letterSpacing", v)}
          />
          <NumberField
            label="Leading"
            value={settings.lineHeight}
            min={0.8}
            max={3}
            step={0.05}
            onChange={(v) => update("lineHeight", v)}
          />

          <button
            type="button"
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            className="rounded-lg border px-2.5 py-1.5 text-[12px]"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle colour theme"
            className="rounded-lg border px-2.5 py-1.5 text-[12px]"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        <div
          className="flex flex-wrap items-center gap-3 border-t px-4 py-2"
          style={{ borderColor: "var(--line)" }}
        >
          <Segmented
            label="Columns"
            value={columns}
            onChange={setColumns}
            options={[1, 2, 3, 4, 6].map((n) => ({ value: n, label: String(n) }))}
          />
          <Segmented
            label="Sort order"
            value={sort}
            onChange={(value) => {
              setSort(value);
              if (value === "random") setSeed(Date.now() % 100000);
            }}
            options={[
              { value: "popular", label: "Popular" },
              { value: "az", label: "A–Z" },
              { value: "za", label: "Z–A" },
              { value: "recent", label: "Recent" },
              { value: "random", label: "Random" },
            ]}
          />
          <Segmented
            label="Preview weight"
            value={settings.weight}
            onChange={(v) => update("weight", v)}
            options={[300, 400, 500, 700, 900].map((w) => ({ value: w, label: String(w) }))}
          />
          <button
            type="button"
            onClick={() => update("italic", !settings.italic)}
            aria-pressed={settings.italic}
            className="rounded-lg px-2.5 py-1 text-[12px] italic"
            style={{
              background: settings.italic ? "var(--accent-soft)" : "var(--surface)",
              color: settings.italic ? "var(--accent)" : "var(--muted)",
            }}
          >
            Italic
          </button>

          <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}>
            <span>Auto-scroll</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              aria-label="Auto-scroll speed"
              className="h-1 w-20 cursor-pointer"
            />
            <span className="w-8 tabular-nums">{scrollSpeed.toFixed(1)}×</span>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] tabular-nums" style={{ color: "var(--muted)" }}>
              {fonts.length.toLocaleString()} fonts
            </span>
            <button
              type="button"
              onClick={() => setShowExport(true)}
              disabled={selectedFonts.length === 0}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium disabled:opacity-40"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Export ({selectedFonts.length})
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className="scroll-thin sticky top-[105px] hidden h-[calc(100vh-105px)] w-56 shrink-0 overflow-y-auto border-r p-3 lg:block"
          style={{ borderColor: "var(--line)" }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fonts…"
            aria-label="Search fonts"
            className="mb-3 w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
            style={{ borderColor: "var(--line)", background: "var(--canvas)", color: "var(--ink)" }}
          />

          <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Source
          </p>
          {(
            [
              ["all", "All fonts"],
              ["local", "Your fonts"],
              ["google", "Google Fonts"],
              ["fontshare", "Fontshare"],
              ["favorites", "Favourites"],
              ["selected", "Selected"],
              ["hidden", "Hidden"],
            ] as [SourceTab, string][]
          ).map(([value, label]) => (
            <Chip key={value} active={tab === value} onClick={() => setTab(value)} count={counts[value]}>
              {label}
            </Chip>
          ))}

          {localFonts.length === 0 && (
            <div className="mt-2 px-2.5">
              {canUseLocalFonts ? (
                <button
                  type="button"
                  onClick={grantLocalFonts}
                  className="w-full rounded-lg px-2.5 py-1.5 text-[12px] font-medium"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  Grant font access
                </button>
              ) : (
                <p className="text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
                  Local fonts need a Chromium browser.
                </p>
              )}
              {localError && (
                <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
                  {localError}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Category
          </p>
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            All categories
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}

          {(favorites.count > 0 || hidden.count > 0 || selected.count > 0) && (
            <div className="mt-4 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--line)" }}>
              {selected.count > 0 && (
                <Chip active={false} onClick={selected.clear}>
                  Clear selection
                </Chip>
              )}
              {hidden.count > 0 && (
                <Chip active={false} onClick={hidden.clear}>
                  Unhide all
                </Chip>
              )}
              {favorites.count > 0 && (
                <Chip active={false} onClick={favorites.clear}>
                  Clear favourites
                </Chip>
              )}
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1 p-4">
          {loading && (
            <p className="p-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
              Loading font catalogues…
            </p>
          )}

          {loadError && !loading && (
            <p className="p-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
              {loadError}
            </p>
          )}

          {!loading && !loadError && fonts.length === 0 && (
            <p className="p-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
              No fonts match these filters.
            </p>
          )}

          <div className={`grid gap-3 ${COLUMN_CLASS[columns] ?? COLUMN_CLASS[2]}`}>
            {shown.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                settings={settings}
                isFavorite={favorites.set.has(font.id)}
                isSelected={selected.set.has(font.id)}
                onToggleFavorite={favorites.toggle}
                onToggleSelected={selected.toggle}
                onToggleHidden={hidden.toggle}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-10" />
        </main>
      </div>

      {showExport && (
        <ExportPanel fonts={selectedFonts} settings={settings} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
