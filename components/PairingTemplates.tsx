"use client";

import type { CSSProperties } from "react";

export const TEMPLATES = ["hero", "editorial", "product"] as const;
export type Template = (typeof TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<Template, string> = {
  hero: "Hero",
  editorial: "Editorial",
  product: "Product card",
};

export const CANVASES = ["paper", "sand", "ink"] as const;
export type Canvas = (typeof CANVASES)[number];

export const CANVAS_LABELS: Record<Canvas, string> = {
  paper: "Paper",
  sand: "Sand",
  ink: "Ink",
};

export interface CanvasTokens {
  bg: string;
  ink: string;
  muted: string;
  line: string;
  panel: string;
  solid: string;
  onSolid: string;
}

/**
 * Canvases for the mock, independent of the app's own light/dark theme: a
 * pairing has to be judged on the surface it will actually ship on.
 */
export const CANVAS_TOKENS: Record<Canvas, CanvasTokens> = {
  paper: {
    bg: "#ffffff",
    ink: "#111113",
    muted: "#71717a",
    line: "#e7e7ea",
    panel: "#f4f4f5",
    solid: "#111113",
    onSolid: "#ffffff",
  },
  sand: {
    bg: "#f9f5ed",
    ink: "#1c1917",
    muted: "#79716b",
    line: "#e6dccb",
    panel: "#f1e9da",
    solid: "#1c1917",
    onSolid: "#f9f5ed",
  },
  ink: {
    bg: "#101013",
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    line: "#2b2b33",
    panel: "#1a1a20",
    solid: "#f4f4f5",
    onSolid: "#101013",
  },
};

export interface PreviewProps {
  headingFamily: string;
  bodyFamily: string;
  headingSize: number;
  bodySize: number;
  headingWeight: number;
  bodyWeight: number;
  letterSpacing: number;
  lineHeight: number;
  radius: number;
  tokens: CanvasTokens;
  headline: string;
  headlineTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

const LEDE =
  "Empower your design team with automated workflows, real-time collaboration and component systems that scale.";

function useStyles(p: PreviewProps) {
  const heading: CSSProperties = {
    fontFamily: p.headingFamily,
    fontWeight: p.headingWeight,
    letterSpacing: `${p.letterSpacing - 0.015}em`,
    lineHeight: Math.max(1, p.lineHeight * 0.82),
    textTransform: p.headlineTransform,
  };
  const body: CSSProperties = {
    fontFamily: p.bodyFamily,
    fontWeight: p.bodyWeight,
    lineHeight: Math.max(1.45, p.lineHeight),
  };
  return { heading, body };
}

function Pill({ p, children }: { p: PreviewProps; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5"
      style={{
        background: p.tokens.panel,
        borderRadius: 999,
        fontSize: p.bodySize * 0.82,
      }}
    >
      {children}
    </span>
  );
}

function Button({
  p,
  variant = "solid",
  children,
}: {
  p: PreviewProps;
  variant?: "solid" | "quiet";
  children: React.ReactNode;
}) {
  const solid = variant === "solid";
  return (
    <span
      className="inline-flex items-center px-4 py-2.5"
      style={{
        borderRadius: p.radius,
        background: solid ? p.tokens.solid : p.tokens.panel,
        color: solid ? p.tokens.onSolid : p.tokens.ink,
        fontSize: p.bodySize * 0.95,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function Hero(p: PreviewProps) {
  const s = useStyles(p);
  return (
    <div className="px-8 py-10 sm:px-12" style={{ color: p.tokens.ink }}>
      <nav
        className="mb-10 flex items-center justify-between border-b pb-5"
        style={{ borderColor: p.tokens.line, ...s.body, fontSize: p.bodySize * 0.95 }}
      >
        <span style={{ ...s.heading, fontSize: p.bodySize * 1.25, lineHeight: 1 }}>Meridian</span>
        <span className="hidden gap-6 sm:flex" style={{ color: p.tokens.muted }}>
          <span>Product</span>
          <span>Pricing</span>
          <span>Docs</span>
        </span>
        <Button p={p}>Get started</Button>
      </nav>

      <div className="flex flex-col items-center text-center">
        <Pill p={p}>
          <span
            style={{ width: 7, height: 7, borderRadius: 999, background: "#22c55e", display: "inline-block" }}
          />
          <span style={{ ...s.body }}>Version 2.0 is out</span>
        </Pill>

        <h3 className="preview-text mt-6 max-w-[16ch]" style={{ ...s.heading, fontSize: p.headingSize }}>
          {p.headline}
        </h3>

        <p
          className="preview-text mt-5 max-w-[46ch]"
          style={{ ...s.body, fontSize: p.bodySize, color: p.tokens.muted }}
        >
          {LEDE}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3" style={s.body}>
          <Button p={p}>Start free trial</Button>
          <Button p={p} variant="quiet">
            Book a demo
          </Button>
        </div>
      </div>
    </div>
  );
}

function Editorial(p: PreviewProps) {
  const s = useStyles(p);
  return (
    <div className="px-8 py-10 sm:px-14" style={{ color: p.tokens.ink }}>
      <div
        className="mb-6 flex items-center justify-between border-b pb-4 uppercase"
        style={{
          ...s.body,
          borderColor: p.tokens.line,
          color: p.tokens.muted,
          fontSize: p.bodySize * 0.78,
          letterSpacing: "0.14em",
        }}
      >
        <span>Typography essay</span>
        <span>October 2026 · 6 min read</span>
      </div>

      <h3 className="preview-text max-w-[20ch]" style={{ ...s.heading, fontSize: p.headingSize }}>
        {p.headline}
      </h3>

      <div className="mt-7 flex items-center gap-3">
        <span
          className="grid place-items-center"
          style={{
            width: p.bodySize * 2.6,
            height: p.bodySize * 2.6,
            borderRadius: 999,
            background: p.tokens.solid,
            color: p.tokens.onSolid,
            ...s.body,
            fontSize: p.bodySize * 0.85,
            fontWeight: 600,
          }}
        >
          AW
        </span>
        <span style={s.body}>
          <span className="block" style={{ fontSize: p.bodySize * 0.95, fontWeight: 600 }}>
            Ada Whitfield
          </span>
          <span className="block" style={{ fontSize: p.bodySize * 0.9, color: p.tokens.muted }}>
            Type director
          </span>
        </span>
      </div>

      <p className="preview-text mt-7 max-w-[62ch]" style={{ ...s.body, fontSize: p.bodySize }}>
        {LEDE}
      </p>

      <blockquote
        className="preview-text mt-7 max-w-[54ch] py-1 pl-5"
        style={{
          ...s.heading,
          fontSize: p.bodySize * 1.5,
          lineHeight: 1.35,
          borderLeft: `3px solid ${p.tokens.solid}`,
        }}
      >
        Good typography is invisible. It guides the reader through complex information with
        natural rhythm and clarity.
      </blockquote>
    </div>
  );
}

function Product(p: PreviewProps) {
  const s = useStyles(p);
  return (
    <div className="grid place-items-center px-8 py-10">
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          borderRadius: p.radius + 6,
          border: `1px solid ${p.tokens.line}`,
          color: p.tokens.ink,
        }}
      >
        <div
          className="grid place-items-center px-6"
          style={{ background: p.tokens.panel, height: p.headingSize * 3.6 }}
        >
          <span
            className="preview-text text-center"
            style={{ ...s.heading, fontSize: p.headingSize * 0.62 }}
          >
            Aa Bb Cc
          </span>
        </div>

        <div className="p-6">
          <h3 className="preview-text" style={{ ...s.heading, fontSize: p.headingSize * 0.5 }}>
            {p.headline}
          </h3>
          <p
            className="preview-text mt-3"
            style={{ ...s.body, fontSize: p.bodySize, color: p.tokens.muted }}
          >
            {LEDE}
          </p>

          <div
            className="mt-6 flex items-end justify-between border-t pt-5"
            style={{ borderColor: p.tokens.line }}
          >
            <span style={s.body}>
              <span
                className="block uppercase"
                style={{
                  fontSize: p.bodySize * 0.72,
                  letterSpacing: "0.12em",
                  color: p.tokens.muted,
                }}
              >
                Licence included
              </span>
              <span className="block" style={{ fontSize: p.bodySize * 1.15, fontWeight: 600 }}>
                $49 · Commercial
              </span>
            </span>
            <span style={s.body}>
              <Button p={p}>Add to cart</Button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatePreview(props: PreviewProps & { template: Template }) {
  if (props.template === "hero") return <Hero {...props} />;
  if (props.template === "editorial") return <Editorial {...props} />;
  return <Product {...props} />;
}
