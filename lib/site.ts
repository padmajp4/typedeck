/**
 * Single source of truth for anything that has to agree across metadata,
 * the sitemap, robots.txt, the manifest and the structured data.
 */

/**
 * The canonical origin. Hard-coded to the production domain so canonical and
 * og:url tags never point at a preview or *.vercel.app host, which would split
 * ranking signals. Override with NEXT_PUBLIC_SITE_URL if the domain changes.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  return (explicit || "https://typedeck.padmajp.com").replace(/\/$/, "");
}

export const SITE = {
  url: resolveSiteUrl(),
  name: "Typedeck",
  title: "Typedeck — Preview and compare 2,000+ fonts side by side",
  shortDescription: "Preview 2,000+ fonts side by side.",
  description:
    "Preview and compare over 2,000 typefaces side by side. Browse Google Fonts, Fontshare and your own installed or uploaded fonts with live text, size, spacing and leading controls, font pairing and a WCAG contrast checker. Free, no sign-up.",
  locale: "en_GB",
  /** Microsoft Clarity project id. Public by design — it ships in client JS. */
  clarityId: "ycegm5jlij",
  supportUrl: "https://buymeacoffee.com/padmaj",
  author: "Padmaj P Kumar",
  keywords: [
    "font preview",
    "font comparison",
    "Google Fonts browser",
    "font pairing tool",
    "typeface finder",
    "font tester",
    "typography tool",
    "Fontshare",
    "variable fonts",
    "WCAG contrast checker",
  ],
} as const;
