"use client";

/** Small shared control primitives used across the toolbar and sidebar. */

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: "var(--surface)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className="rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: active ? "var(--canvas)" : "transparent",
              color: active ? "var(--ink)" : "var(--muted)",
              boxShadow: active ? "0 1px 2px rgb(0 0 0 / 0.08)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A labelled numeric control that is both draggable (range) and typeable.
 */
export function NumberField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  function commit(raw: string) {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
  }

  return (
    <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}>
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => commit(e.target.value)}
        aria-label={label}
        className="h-1 w-20 cursor-pointer sm:w-24"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => commit(e.target.value)}
        aria-label={`${label} value`}
        className="w-14 rounded-md border px-1.5 py-1 text-[12px] tabular-nums outline-none"
        style={{
          borderColor: "var(--line)",
          background: "var(--canvas)",
          color: "var(--ink)",
        }}
      />
      {suffix && <span className="w-3">{suffix}</span>}
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors"
      style={{
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink)",
        fontWeight: active ? 500 : 400,
      }}
    >
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}
