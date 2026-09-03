import Typedeck from "@/components/Typedeck";
import { SITE } from "@/lib/site";

/**
 * Structured data describing the app itself. Search engines use this for rich
 * results; the free-of-charge offer is what makes it eligible.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any modern web browser",
  browserRequirements: "Requires JavaScript.",
  inLanguage: "en",
  author: { "@type": "Person", name: SITE.author },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Preview over 2,000 fonts side by side",
    "Google Fonts, Fontshare, locally installed and uploaded fonts",
    "Live text, size, letter-spacing and line-height controls",
    "Font pairing preview",
    "WCAG contrast checker",
    "Shareable permalinks",
    "Export CSS and HTML",
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // Serialised from a literal above, so there is no untrusted input here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Typedeck />
    </>
  );
}
