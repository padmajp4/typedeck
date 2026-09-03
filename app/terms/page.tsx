import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that govern use of ${SITE.name}, including font licensing and how your data is handled.`,
  alternates: { canonical: "/terms" },
};

const UPDATED = "3 September 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-[15px] font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link
        href="/"
        className="text-[13px] hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Back to {SITE.name}
      </Link>

      <h1 className="mt-6 mb-1 text-[26px] font-semibold tracking-tight">Terms of Use</h1>
      <p className="mb-8 text-[13px]" style={{ color: "var(--muted)" }}>
        Last updated {UPDATED}
      </p>

      <Section title="The service">
        <p>
          {SITE.name} is a free tool for previewing and comparing typefaces. It is provided
          as-is, without warranty of any kind. It may change or stop working at any time, and
          no uptime is guaranteed.
        </p>
      </Section>

      <Section title="Font licensing">
        <p>
          {SITE.name} does not sell, sublicense, or grant you any rights to the typefaces it
          displays. Fonts are shown for preview only.
        </p>
        <p>
          Google Fonts are served by Google and carry their own licences, most commonly the
          SIL Open Font Licence. Fontshare families are served by the Indian Type Foundry
          under the terms published on their site. Fonts installed on your machine or
          uploaded by you carry whatever licence you obtained them under.
        </p>
        <p>
          Before using any typeface in a project, it is your responsibility to check and
          comply with that font&rsquo;s licence. Previewing a font here grants you no rights
          to use it.
        </p>
      </Section>

      <Section title="Your fonts and your data">
        <p>
          {SITE.name} has no user accounts and no server-side database. Your preview settings,
          favourites, hidden fonts and selections are stored in your own browser&rsquo;s local
          storage and never transmitted to us.
        </p>
        <p>
          Font files you upload are read and rendered entirely in your browser. They are never
          uploaded to any server, and no copy is retained; they are discarded when you reload
          the page. Granting access to your installed fonts is likewise handled by your
          browser, and that list is never sent anywhere.
        </p>
        <p>
          Previewing fonts does cause your browser to request font files directly from Google
          Fonts and Fontshare, which is subject to their respective privacy policies.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Please do not attempt to disrupt the service, use it to infringe anyone&rsquo;s
          intellectual property, or scrape it in a way that places unreasonable load on it or
          on the upstream font providers.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the fullest extent permitted by law, the operator of {SITE.name} accepts no
          liability for any loss or damage arising from use of the service, including any
          consequence of relying on font information shown here.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms can be directed to{" "}
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
      </Section>
    </main>
  );
}
