"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FontCard from "./FontCard";
import Logo from "./Logo";
import ExportPanel from "./ExportPanel";
import GlyphMap from "./GlyphMap";
import PairingView, { DEFAULT_PAIRING, type PairingState } from "./PairingView";
import ColorControls from "./ColorControls";
import { Chip, NumberField, Segmented } from "./ui";
import { queryLocalFonts, supportsLocalFonts } from "@/lib/localFonts";
import { loadCustomFonts } from "@/lib/customFonts";
import { decodeShareState, encodeShareState } from "@/lib/permalink";
import { usePersistentSet, usePersistentState } from "@/lib/useStore";
import { SITE } from "@/lib/site";
import {
  CATEGORIES,
  DEFAULT_SETTINGS,
  type FontCategory,
  type FontItem,
  type PreviewSettings,
} from "@/lib/types";

type SourceTab =
  | "all"
  | "local"
  | "custom"
  | "google"
  | "fontshare"
  | "favorites"
  | "selected"
  | "hidden";

type SortMode = "az" | "za" | "popular" | "recent" | "random";

type View = "grid" | "pair";

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

export default function Typedeck() {
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
  const [view, setView] = useState<View>("grid");
  const [pairHeading, setPairHeading] = useState<string | null>(null);
  const [pairBody, setPairBody] = useState<string | null>(null);
  const [pairing, setPairing] = usePersistentState<PairingState>("pairing", DEFAULT_PAIRING);
  const [customFonts, setCustomFonts] = useState<FontItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  // Below the lg breakpoint the sidebar is hidden, so its controls live in a
  // sheet instead; without it search and filters are unreachable on a phone.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [glyphFont, setGlyphFont] = useState<FontItem | null>(null);
  // Feature detection must run after mount so SSR and hydration agree.
  const [canUseLocalFonts, setCanUseLocalFonts] = useState(false);

  const favorites = usePersistentSet("favorites");
  const selected = usePersistentSet("selected");
  const hidden = usePersistentSet("hidden");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // The toolbar wraps to two or three rows depending on width, so the sticky
  // sidebar's offset has to follow the header's real height rather than a
  // hard-coded guess.
  const [headerHeight, setHeaderHeight] = useState(105);

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
    () => [...customFonts, ...localFonts, ...remoteFonts],
    [customFonts, localFonts, remoteFonts],
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

  /** Register dropped or picked font files. Nothing leaves the browser. */
  const addCustomFonts = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const { fonts, rejected } = await loadCustomFonts(files);

    setCustomFonts((current) => {
      // A re-uploaded family replaces its earlier registration.
      const incoming = new Set(fonts.map((f) => f.id));
      return [...fonts, ...current.filter((f) => !incoming.has(f.id))];
    });

    if (fonts.length) setTab("custom");
    setUploadNote(
      rejected.length
        ? `Could not read ${rejected.length} file${rejected.length === 1 ? "" : "s"}.`
        : `Added ${fonts.length} font${fonts.length === 1 ? "" : "s"}.`,
    );
    setTimeout(() => setUploadNote(null), 4000);
  }, []);

  const counts = useMemo(
    () => ({
      all: allFonts.filter((f) => !hidden.set.has(f.id)).length,
      local: localFonts.length,
      custom: customFonts.length,
      google: remoteFonts.filter((f) => f.source === "google").length,
      fontshare: remoteFonts.filter((f) => f.source === "fontshare").length,
      favorites: favorites.count,
      selected: selected.count,
      hidden: hidden.count,
    }),
    [
      allFonts,
      localFonts,
      customFonts,
      remoteFonts,
      favorites.count,
      selected.count,
      hidden.count,
      hidden.set,
    ],
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
        case "custom":
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
    const node = headerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeaderHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // A shared link wins over whatever was last stored locally. This effect is
  // declared after the persistence hooks, so it runs once their reads land.
  useEffect(() => {
    const shared = decodeShareState(window.location.hash);
    if (!shared) return;
    if (shared.settings) setSettings(shared.settings);
    if (shared.tab) setTab(shared.tab as SourceTab);
    if (shared.category) setCategory(shared.category as FontCategory | "all");
    if (shared.search !== undefined) setSearch(shared.search);
    if (shared.sort) setSort(shared.sort as SortMode);
    if (shared.columns) setColumns(shared.columns);
    if (shared.view) setView(shared.view as View);
    setPairHeading(shared.pairHeading ?? null);
    setPairBody(shared.pairBody ?? null);
    setPairing({
      template: (shared.template ?? DEFAULT_PAIRING.template) as PairingState["template"],
      canvas: (shared.canvas ?? DEFAULT_PAIRING.canvas) as PairingState["canvas"],
      radius: shared.radius ?? DEFAULT_PAIRING.radius,
      headingSize: shared.headingSize ?? DEFAULT_PAIRING.headingSize,
      bodySize: shared.bodySize ?? DEFAULT_PAIRING.bodySize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Put the current view on the clipboard as a self-contained link. */
  async function copyShareLink() {
    const fragment = encodeShareState({
      settings,
      tab,
      category,
      search,
      sort,
      columns,
      view,
      pairHeading,
      pairBody,
      ...pairing,
    });
    const url = `${window.location.origin}${window.location.pathname}${
      fragment ? `#${fragment}` : ""
    }`;
    // Reflect the state in the address bar too, without adding history entries.
    history.replaceState(null, "", fragment ? `#${fragment}` : window.location.pathname);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      // Clipboard may be blocked; the address bar now holds the same link.
    }
  }

  // The auto-scroll control is hidden outside the grid, so make sure a running
  // scroll cannot be stranded with no way to stop it.
  useEffect(() => {
    if (view !== "grid") setScrollSpeed(0);
  }, [view]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

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

  /**
   * Rendered twice: in the desktop sidebar and in the mobile sheet. Kept as
   * one expression so the two can never drift apart.
   */
  const filterPanel = (
    <>
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
            ["custom", "Uploaded"],
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

        <div className="mt-2 px-2.5">
          <label
            className="block w-full cursor-pointer rounded-lg border border-dashed px-2.5 py-2 text-center text-[12px]"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            Upload font files
            <input
              type="file"
              multiple
              accept=".ttf,.otf,.woff,.woff2,.ttc"
              className="sr-only"
              onChange={(e) => {
                void addCustomFonts([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
          </label>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
            {uploadNote ?? "Or drop them anywhere. Files stay in your browser."}
          </p>
        </div>

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
        <div
          className="mt-auto flex flex-col gap-1 border-t pt-3 text-[11px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <p>
            Made with <span style={{ color: "#e0245e" }}>&hearts;</span> by{" "}
            <a
              href="https://padmajp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--ink)" }}
            >
              padmajp.com
            </a>
          </p>
          <a
            href={SITE.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <span aria-hidden="true">☕</span> Buy me a coffee
          </a>
          <Link href="/terms" className="mt-0.5 w-fit hover:underline">
            Terms of Use
          </Link>
        </div>
    </>
  );

  return (
    <div
      className="min-h-screen"
      onDragOver={(e) => {
        // Only react to an actual file drag, not text selections.
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(false);
        void addCustomFonts([...e.dataTransfer.files]);
      }}
    >
      {dragging && (
        <div
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
          style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
        >
          <p
            className="rounded-xl border-2 border-dashed px-6 py-4 text-[14px] font-medium"
            style={{ borderColor: "var(--accent)", background: "var(--canvas)", color: "var(--accent)" }}
          >
            Drop font files to preview them
          </p>
        </div>
      )}
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--line)", background: "var(--canvas)" }}
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <h1>
            <Logo />
          </h1>

          <input
            value={settings.text}
            onChange={(e) => update("text", e.target.value)}
            placeholder="Type to preview…"
            aria-label="Preview text"
            className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-[13px] outline-none"
            style={{ borderColor: "var(--line)", background: "var(--canvas)", color: "var(--ink)" }}
          />

          {view === "grid" && (
            <NumberField
              label="Size"
              value={settings.size}
            min={8}
            max={200}
            step={1}
              onChange={(v) => update("size", v)}
            />
          )}
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
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "grid" as View, label: "Grid" },
              { value: "pair" as View, label: "Pair" },
            ]}
          />
          {view === "grid" && (
            <>
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
            </>
          )}

          <Segmented
            label="Letter case"
            value={settings.textCase}
            onChange={(v) => update("textCase", v)}
            options={[
              { value: "none" as const, label: "Aa" },
              { value: "upper" as const, label: "AA" },
              { value: "lower" as const, label: "aa" },
              { value: "title" as const, label: "Ab" },
            ]}
          />

          {view === "grid" && <ColorControls settings={settings} onChange={update} />}

          {view === "grid" && (
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
          )}

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="rounded-lg border px-2.5 py-1.5 text-[12px] font-medium lg:hidden"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Filters
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] tabular-nums" style={{ color: "var(--muted)" }}>
              {fonts.length.toLocaleString()} font{fonts.length === 1 ? "" : "s"}
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
            <button
              type="button"
              onClick={copyShareLink}
              title="Copy a link to this exact view"
              className="rounded-lg border px-2.5 py-1.5 text-[12px]"
              style={{ borderColor: "var(--line)", color: "var(--muted)" }}
            >
              {copiedLink ? "Link copied" : "Share"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className="scroll-thin sticky hidden w-56 shrink-0 flex-col overflow-y-auto border-r p-3 lg:flex"
          style={{
            borderColor: "var(--line)",
            top: headerHeight,
            height: `calc(100vh - ${headerHeight}px)`,
          }}
        >
          {filterPanel}
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

          {!loading && !loadError && view === "grid" && fonts.length === 0 && (
            <p className="p-8 text-center text-[13px]" style={{ color: "var(--muted)" }}>
              No fonts match these filters.
            </p>
          )}

          {view === "pair" ? (
            <PairingView
              fonts={fonts.length ? fonts : allFonts}
              settings={settings}
              headingId={pairHeading}
              bodyId={pairBody}
              pairing={pairing}
              onChangeHeading={setPairHeading}
              onChangeBody={setPairBody}
              onChangePairing={(patch) =>
                setPairing((current) => ({ ...current, ...patch }))
              }
            />
          ) : (
            <>
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
                    onOpenGlyphs={setGlyphFont}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-10" />
            </>
          )}
        </main>
      </div>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 h-full w-full"
            style={{ background: "rgb(0 0 0 / 0.45)" }}
          />
          <div
            className="scroll-thin relative ml-auto flex h-full w-[86%] max-w-xs flex-col overflow-y-auto border-l p-3"
            style={{ background: "var(--canvas)", borderColor: "var(--line)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold">Filters</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid h-7 w-7 place-items-center rounded-md text-[15px]"
                style={{ color: "var(--muted)" }}
              >
                ×
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {glyphFont && <GlyphMap font={glyphFont} onClose={() => setGlyphFont(null)} />}

      {showExport && (
        <ExportPanel fonts={selectedFonts} settings={settings} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
