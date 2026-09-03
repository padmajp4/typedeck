import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & how to use",
  description: `What ${SITE.name} does, where its fonts come from, and how to use every feature: sources, preview controls, pairing, export and sharing.`,
  alternates: { canonical: "/about" },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-9 scroll-mt-6">
      <h2 className="mb-2 text-[15px] font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {children}
      </div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="rounded border px-1.5 py-0.5 font-mono text-[12px]"
      style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
    >
      {children}
    </kbd>
  );
}

const TOC = [
  ["sources", "Where the fonts come from"],
  ["preview", "The preview controls"],
  ["organising", "Organising fonts"],
  ["glyphs", "Checking a font's character set"],
  ["pairing", "The pairing view"],
  ["exporting", "Exporting and printing"],
  ["sharing", "Sharing a view"],
  ["privacy", "Local fonts, uploads and privacy"],
] as const;

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-[13px] hover:underline" style={{ color: "var(--accent)" }}>
        ← Back to {SITE.name}
      </Link>

      <h1 className="mt-6 mb-1 text-[26px] font-semibold tracking-tight">About & how to use</h1>
      <p className="mb-6 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {SITE.name} previews and compares over 2,000 typefaces side by side, entirely in your
        browser. No sign-up, and none of your data is uploaded: your text, filters and choices
        stay on your machine. This page walks through what every control does.
      </p>

      <nav
        className="mb-9 rounded-xl border p-4"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        aria-label="On this page"
      >
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          On this page
        </p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="sources" title="Where the fonts come from">
        <p>
          The <strong style={{ color: "var(--ink)" }}>Source</strong> tabs in the sidebar switch
          between four catalogues:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>Google Fonts</strong>: around 1,950 open
            families, fetched from Google&rsquo;s public catalogue.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Fontshare</strong>: around 100 families from
            the Indian Type Foundry.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Your fonts</strong>: the typefaces already
            installed on your computer. Click{" "}
            <strong style={{ color: "var(--ink)" }}>Grant font access</strong> in the sidebar (or
            the banner above the grid) and pick Allow in the browser prompt. This uses the{" "}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Local_Font_Access_API"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Local Font Access API
            </a>
            , which only Chromium-based browsers (Chrome, Edge, Brave, Arc) currently support.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Uploaded</strong>: drag a{" "}
            <code>.ttf</code>, <code>.otf</code>, <code>.woff</code> or <code>.woff2</code> file
            anywhere on the page, or use{" "}
            <strong style={{ color: "var(--ink)" }}>Upload font files</strong> in the sidebar.
          </li>
        </ul>
        <p>
          Every catalogue can be filtered by category (Sans Serif, Serif, Monospace, Display or
          Handwriting) and searched by family or designer name.
        </p>
      </Section>

      <Section id="preview" title="The preview controls">
        <p>The toolbar at the top applies to every card in the grid at once:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>The text field</strong>: type your own
            sample text; every card updates live.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Size, Spacing, Leading</strong>: font size,
            letter-spacing and line-height.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Weight and Italic</strong>: a family only
            previews at a weight it actually ships; the closest available weight is used
            automatically if the exact one is missing.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Letter case</strong>: <code>Aa</code> as
            typed, <code>AA</code> uppercase, <code>aa</code> lowercase, or{" "}
            <code>Ab</code> Title Case. This only changes how the text displays; what you typed
            is never rewritten. Uppercase is the standard way to judge a display face for a logo
            or heading, and it exposes uneven letter-spacing that lowercase tends to hide.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Colours</strong>: set a custom text and
            background colour for the preview text, with a live WCAG contrast ratio next to the
            swatches so you can check legibility as you browse.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Columns</strong>: 1 to 6 cards per row.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Sort</strong>: Popular, A–Z, Z–A, Recent or
            Random.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Auto-scroll</strong>: scrolls the page for
            you at 0.5×–5× speed, for browsing hands-free.
          </li>
        </ul>
      </Section>

      <Section id="organising" title="Organising fonts">
        <p>Hover any card to reveal its actions:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>☆ Favourite</strong>: for fonts you like.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>◎ Select</strong>: for building a set to
            export, print or share.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>⊘ Hide</strong>: for fonts you never want
            to see again. Unhide them from the Hidden tab.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>⧉ Copy</strong>: copies the family name.
          </li>
        </ul>
        <p>
          Favourites, Selected and Hidden each get their own sidebar tab, and all three persist
          in your browser between visits.
        </p>
      </Section>

      <Section id="glyphs" title="Checking a font's character set">
        <p>
          Click <strong style={{ color: "var(--ink)" }}>Aa</strong> on a card to open its
          character map: uppercase, lowercase, numerals, punctuation, symbols and accented
          Latin, grouped by set. Click any glyph to copy it. The count shown reflects the
          characters that family actually draws. A glyph the font is missing is left out rather
          than shown in a fallback face.
        </p>
      </Section>

      <Section id="pairing" title="The pairing view">
        <p>
          Switch <strong style={{ color: "var(--ink)" }}>Grid</strong> to{" "}
          <strong style={{ color: "var(--ink)" }}>Pair</strong> to test a heading face against a
          body face together, rendered in a real layout rather than as two blocks of text:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>Layout</strong>: Hero, Editorial or Product
            card.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Canvas</strong>: Paper, Sand or Ink,
            independent of the app&rsquo;s own light/dark theme. A pairing should be judged on
            the surface it will actually ship on.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Radius</strong>: the corner rounding of
            buttons and cards in the mock.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Surprise me</strong>: picks a random pair;{" "}
            <strong style={{ color: "var(--ink)" }}>⇄</strong> swaps heading and body.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Copy pair CSS</strong>: copies a ready-to-
            paste stylesheet: the Google Fonts import plus heading and body rules.
          </li>
        </ul>
      </Section>

      <Section id="exporting" title="Exporting and printing">
        <p>Select one or more fonts (the ◎ action on a card) to unlock these:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>Export</strong>: copy the selection as CSS,
            HTML, or a plain list of family names.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Print</strong>: a clean, chrome-free
            specimen sheet of the selection, ready to save as a PDF from your browser&rsquo;s
            print dialog.
          </li>
        </ul>
        <p>Every card can also export itself individually, without any selection:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong style={{ color: "var(--ink)" }}>PNG</strong>: a sharp raster image of that
            card&rsquo;s current preview.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>SVG</strong>: a vector image. For Google
            Fonts and Fontshare families the actual font file is embedded in the SVG, so it
            renders correctly even on a machine that doesn&rsquo;t have the font installed.
            Uploaded fonts can&rsquo;t be re-fetched, so their SVG falls back to referencing the
            font by name instead.
          </li>
        </ul>
      </Section>

      <Section id="sharing" title="Sharing a view">
        <p>
          <strong style={{ color: "var(--ink)" }}>Share</strong> copies a link that encodes your
          entire view (preview text, size, spacing, weight, case, colours, filters, sort, columns,
          and the whole pairing studio setup) into the URL itself. Anyone who opens it
          sees exactly what you saw, with nothing stored on a server.
        </p>
      </Section>

      <Section id="privacy" title="Local fonts, uploads and privacy">
        <p>
          {SITE.name} has no accounts and no server-side database. Your settings, favourites and
          selections live in your browser&rsquo;s local storage. Fonts you upload are read
          entirely in your browser, kept in your browser&rsquo;s own storage so they survive a
          reload, and never sent to a server. Remove them any time with{" "}
          <strong style={{ color: "var(--ink)" }}>Remove uploaded fonts</strong> in the sidebar.
          The list of fonts installed on your computer is likewise read locally and never
          transmitted anywhere. Full detail is in the{" "}
          <Link href="/terms" className="hover:underline" style={{ color: "var(--accent)" }}>
            Terms of Use
          </Link>
          .
        </p>
      </Section>

      <p className="text-[12px]" style={{ color: "var(--muted)" }}>
        Press <Kbd>Esc</Kbd> to close any open dialog or sheet. Questions? Reach out via{" "}
        <a
          href="https://padmajp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "var(--accent)" }}
        >
          padmajp.com
        </a>
        .
      </p>
    </main>
  );
}
