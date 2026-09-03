/** WCAG 2.1 contrast maths, used by the colour checker. */

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG, from sRGB channels in 0-255. */
function luminance([r, g, b]: [number, number, number]) {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two hex colours, from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return null;
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastVerdict {
  ratio: number;
  /** The strongest level this ratio satisfies at the given size. */
  level: "AAA" | "AA" | "Fail";
  /** WCAG treats >=24px, or >=18.66px bold, as large text with looser limits. */
  large: boolean;
}

export function assessContrast(
  foreground: string,
  background: string,
  fontSize: number,
  weight: number,
): ContrastVerdict | null {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;

  const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;

  return {
    ratio,
    large,
    level: ratio >= aaa ? "AAA" : ratio >= aa ? "AA" : "Fail",
  };
}
