import { NextResponse } from "next/server";
import type { FontCategory, FontItem } from "@/lib/types";

const API = "https://api.fontshare.com/v2/fonts";
// The catalogue endpoint caps out at 100 families however it is paged.
const PAGE_SIZE = 100;

export const revalidate = 86400;

interface FontshareStyle {
  file: string;
  is_italic: boolean;
  is_variable: boolean;
  weight: { weight: number };
}

interface FontshareFont {
  name: string;
  slug: string;
  category: string | { name?: string };
  designers?: { name: string }[];
  inserted_at?: string;
  styles: FontshareStyle[];
}

const CATEGORY_MAP: Record<string, FontCategory> = {
  "sans serif": "Sans Serif",
  sans: "Sans Serif",
  serif: "Serif",
  slab: "Serif",
  monospace: "Monospace",
  mono: "Monospace",
  display: "Display",
  blackletter: "Display",
  handwriting: "Handwriting",
  handwritten: "Handwriting",
  script: "Handwriting",
};

/**
 * Fontshare tags families with a comma-separated list such as
 * "Serif, Blackletter, Display". Take the first token we recognise, which is
 * the family's primary classification.
 */
function normaliseCategory(category: FontshareFont["category"]): FontCategory {
  const raw = typeof category === "string" ? category : (category?.name ?? "");
  for (const token of raw.split(",")) {
    const mapped = CATEGORY_MAP[token.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return "Other";
}

/**
 * Fontshare hands back protocol-relative URLs with no file extension. The CDN
 * serves woff2 (with permissive CORS) once `.woff2` is appended.
 */
function styleUrl(file: string) {
  const withProtocol = file.startsWith("//") ? `https:${file}` : file;
  return `${withProtocol}.woff2`;
}

export async function GET() {
  try {
    const res = await fetch(`${API}?limit=${PAGE_SIZE}`, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Fontshare returned ${res.status}`);

    const data = (await res.json()) as { fonts: FontshareFont[] };
    const collected = data.fonts ?? [];

    const fonts: FontItem[] = collected.map((f) => {
      const styles = f.styles ?? [];
      const files = styles
        .filter((s) => s.file)
        .map((s) => ({
          weight: s.weight?.weight ?? 400,
          italic: Boolean(s.is_italic),
          url: styleUrl(s.file),
        }));
      const weights = [...new Set(files.map((file) => file.weight))].sort((a, b) => a - b);

      return {
        id: `fontshare:${f.name}`,
        family: f.name,
        source: "fontshare" as const,
        category: normaliseCategory(f.category),
        weights: weights.length ? weights : [400],
        hasItalic: files.some((file) => file.italic),
        axes: [],
        designers: (f.designers ?? []).map((d) => d.name).filter(Boolean),
        dateAdded: f.inserted_at?.slice(0, 10),
        downloadUrl: `https://www.fontshare.com/fonts/${f.slug}`,
        files,
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
