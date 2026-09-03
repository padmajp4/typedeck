import { fontFamilyValue } from "./fontLoader";
import { TEXT_TRANSFORM, type FontItem, type PreviewSettings } from "./types";

/**
 * Renders a specimen to an image. Text is drawn rather than screenshotted, so
 * the output is sharp at any scale and carries no app chrome.
 */

const PADDING = 48;
const SCALE = 2; // Retina-quality raster.

function applyCase(text: string, settings: PreviewSettings) {
  switch (settings.textCase) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    default:
      return text;
  }
}

/** Greedy wrap against measured widths, so lines break where they really would. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function cssFont(font: FontItem, settings: PreviewSettings, weight: number) {
  const style = settings.italic && font.hasItalic ? "italic " : "";
  return `${style}${weight} ${settings.size}px ${fontFamilyValue(font)}`;
}

interface Rendered {
  lines: string[];
  width: number;
  height: number;
  lineHeight: number;
}

function layout(
  ctx: CanvasRenderingContext2D,
  font: FontItem,
  settings: PreviewSettings,
  weight: number,
  maxWidth: number,
): Rendered {
  ctx.font = cssFont(font, settings, weight);
  const text = applyCase(settings.text || " ", settings);
  const lines = wrap(ctx, text, maxWidth);
  const lineHeight = settings.size * settings.lineHeight;
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  return { lines, width, height: lines.length * lineHeight, lineHeight };
}

function triggerDownload(blobUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function safeName(font: FontItem, extension: string) {
  return `${font.family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`;
}

export async function exportPng(
  font: FontItem,
  settings: PreviewSettings,
  weight: number,
  maxWidth = 1200,
) {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return;

  const inner = maxWidth - PADDING * 2;
  const { lines, width, height, lineHeight } = layout(measure, font, settings, weight, inner);

  const canvas = document.createElement("canvas");
  canvas.width = (width + PADDING * 2) * SCALE;
  canvas.height = (height + PADDING * 2) * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = settings.colorsEnabled ? settings.bgColor : "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = settings.colorsEnabled ? settings.textColor : "#111113";
  ctx.font = cssFont(font, settings, weight);
  ctx.textBaseline = "alphabetic";
  // letterSpacing is not universally supported; skip it rather than mislead.
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${settings.letterSpacing}em`;
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, PADDING, PADDING + lineHeight * (i + 0.78));
  });

  await new Promise<void>((resolve) =>
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        triggerDownload(url, safeName(font, "png"));
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      resolve();
    }, "image/png"),
  );
}

/**
 * Fetches the family's actual font file and inlines it, so the SVG renders
 * correctly on a machine that does not have the font installed. Without this a
 * text-based SVG would silently fall back to a system face.
 */
async function embeddableFace(font: FontItem, weight: number): Promise<string | null> {
  try {
    let fileUrl: string | null = null;

    if (font.source === "google") {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          font.family,
        )}:wght@${weight}&display=swap`,
      ).then((r) => r.text());
      fileUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1] ?? null;
    } else if (font.source === "fontshare") {
      fileUrl = font.files?.find((f) => f.weight === weight)?.url ?? font.files?.[0]?.url ?? null;
    }
    if (!fileUrl) return null;

    const buffer = await fetch(fileUrl).then((r) => r.arrayBuffer());
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const format = fileUrl.endsWith(".woff2") ? "woff2" : "truetype";

    // The family name is interpolated into this SVG's <style> block below,
    // so it must be XML-escaped here just like the sibling rule in
    // exportSvg is — a raw value could otherwise close the <style> tag and
    // inject markup, as verified with a proof-of-concept payload.
    return `@font-face{font-family:"${escapeXml(font.family)}";font-weight:${weight};src:url(data:font/${
      format === "woff2" ? "woff2" : "ttf"
    };base64,${base64}) format("${format}");}`;
  } catch {
    // Local and uploaded fonts have no fetchable URL; fall back to a plain reference.
    return null;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function exportSvg(
  font: FontItem,
  settings: PreviewSettings,
  weight: number,
  maxWidth = 1200,
) {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return;

  const inner = maxWidth - PADDING * 2;
  const { lines, width, height, lineHeight } = layout(measure, font, settings, weight, inner);
  const face = await embeddableFace(font, weight);

  const w = Math.round(width + PADDING * 2);
  const h = Math.round(height + PADDING * 2);
  const ink = settings.colorsEnabled ? settings.textColor : "#111113";
  const paper = settings.colorsEnabled ? settings.bgColor : "#ffffff";

  const text = lines
    .map(
      (line, i) =>
        `<text x="${PADDING}" y="${(PADDING + lineHeight * (i + 0.78)).toFixed(
          2,
        )}" fill="${ink}">${escapeXml(line)}</text>`,
    )
    .join("\n    ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><style>${face ?? ""}
    text{font-family:${escapeXml(fontFamilyValue(font))};font-size:${settings.size}px;font-weight:${weight};${
      settings.italic && font.hasItalic ? "font-style:italic;" : ""
    }letter-spacing:${settings.letterSpacing}em;}
  </style></defs>
  <rect width="${w}" height="${h}" fill="${paper}"/>
    ${text}
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, safeName(font, "svg"));
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
