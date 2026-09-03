/**
 * The wordmark: a small deck of type cards beside the name. "Type" carries the
 * weight, "deck" recedes, so the two halves read as one lockup rather than a
 * compound word.
 */
export default function Logo() {
  return (
    <span className="flex select-none items-center gap-2">
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Back cards, fanned to suggest a stack you can flip through. */}
        <rect
          x="2.6"
          y="4.4"
          width="12"
          height="15.4"
          rx="2.6"
          fill="var(--accent)"
          opacity="0.22"
          transform="rotate(-11 8.6 12.1)"
        />
        <rect
          x="4.6"
          y="3.4"
          width="12"
          height="15.4"
          rx="2.6"
          fill="var(--accent)"
          opacity="0.4"
          transform="rotate(-5 10.6 11.1)"
        />
        {/* Front card, carrying a specimen letter. */}
        <rect x="7" y="2.6" width="12" height="15.4" rx="2.6" fill="var(--accent)" />
        <text
          x="13"
          y="13.4"
          textAnchor="middle"
          fill="var(--canvas)"
          style={{
            fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          A
        </text>
      </svg>

      <span
        className="text-[17px] leading-none"
        style={{
          fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "-0.035em",
        }}
      >
        <span style={{ fontWeight: 700 }}>Type</span>
        <span style={{ fontWeight: 500, color: "var(--muted)" }}>deck</span>
      </span>
    </span>
  );
}
