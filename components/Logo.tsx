/**
 * The wordmark: a fanned deck of type cards beside the name. "Type" carries
 * the weight, "deck" recedes, so the two halves read as one lockup.
 */
export default function Logo() {
  return (
    <span className="flex select-none items-center gap-2">
      {/* Decorative: the adjacent text already names the app. */}
      <img src="/logo.png" alt="" width={24} height={24} className="shrink-0" />
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
