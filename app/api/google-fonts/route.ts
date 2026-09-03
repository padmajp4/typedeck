import { NextResponse } from "next/server";
import type { FontCategory, FontItem } from "@/lib/types";

// Google's public catalogue metadata. No API key required.
const METADATA_URL = "https://fonts.google.com/metadata/fonts";

// Refresh the catalogue once a day; it changes rarely.
export const revalidate = 86400;

interface GoogleFamily {
  family: string;
  category: string;
  fonts: Record<string, unknown>;
  axes: { tag: string; min: number; max: number; defaultValue: number }[];
  designers: string[];
  popularity: number;
  dateAdded: string;
}

const CATEGORY_MAP: Record<string, FontCategory> = {
  "Sans Serif": "Sans Serif",
  Serif: "Serif",
  Monospace: "Monospace",
  Display: "Display",
  Handwriting: "Handwriting",
};

/**
 * Google keys each style as "400", "400i", "700i" and so on. Split those into
 * the sorted set of numeric weights plus whether any italic style exists.
 */
function parseStyles(fonts: Record<string, unknown>) {
  const weights = new Set<number>();
  let hasItalic = false;
  for (const key of Object.keys(fonts ?? {})) {
    if (key.endsWith("i")) hasItalic = true;
    const weight = Number.parseInt(key, 10);
    if (Number.isFinite(weight)) weights.add(weight);
  }
  const sorted = [...weights].sort((a, b) => a - b);
  return { weights: sorted.length ? sorted : [400], hasItalic };
}

export async function GET() {
  try {
    const res = await fetch(METADATA_URL, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Google Fonts metadata returned ${res.status}`);

    const data = (await res.json()) as { familyMetadataList: GoogleFamily[] };

    const fonts: FontItem[] = data.familyMetadataList.map((f) => {
      const { weights, hasItalic } = parseStyles(f.fonts);
      return {
        id: `google:${f.family}`,
        family: f.family,
        source: "google" as const,
        category: CATEGORY_MAP[f.category] ?? "Other",
        weights,
        hasItalic,
        axes: (f.axes ?? []).map((a) => ({
          tag: a.tag,
          min: a.min,
          max: a.max,
          defaultValue: a.defaultValue,
        })),
        designers: f.designers ?? [],
        popularity: f.popularity,
        dateAdded: f.dateAdded,
        downloadUrl: `https://fonts.google.com/specimen/${encodeURIComponent(
          f.family.replace(/ /g, "+"),
        )}`,
      };
    });

    return NextResponse.json(
      { fonts },
      { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ fonts: [], error: message }, { status: 502 });
  }
}
