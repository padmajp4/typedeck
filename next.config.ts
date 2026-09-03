import type { NextConfig } from "next";

/**
 * A static CSP, not a nonce-based one. Next's App Router hydration injects
 * its own inline <script> blocks carrying the per-page RSC payload — content
 * this app does not author and cannot pin a stable hash for, since it varies
 * per page and likely per deploy. Real nonce protection would need every
 * page rendered dynamically per request (via middleware generating a fresh
 * nonce), which would drop this site's static prerendering entirely — not a
 * trade worth making here. So script-src keeps 'unsafe-inline', which does
 * not stop an injected inline <script> from running; every other directive
 * below is restricted to the exact origins this app actually calls, which
 * does stop the more common follow-on move — exfiltrating data via fetch()
 * or loading a malicious external script — and blocks framing outright.
 */
const CSP = [
  "default-src 'self'",
  // Clarity's bootstrap snippet points at www.clarity.ms, but it actually
  // uses several other subdomains for its real script, its tracking pixel
  // and its data collection endpoint (scripts./c./e.clarity.ms, confirmed
  // live). A wildcard covers those consistently, matching connect-src below,
  // rather than pinning exact subdomains that vendor could change silently.
  "script-src 'self' 'unsafe-inline' https://*.clarity.ms",
  // Inline style attributes are load-bearing throughout this app (every
  // card's live preview styling), so 'unsafe-inline' here is deliberate.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://*.clarity.ms",
  "font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.fontshare.com https://www.clarity.ms https://*.clarity.ms",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * The app has no accounts, cookies or server-side state, so these are defence
 * in depth rather than protection of anything sensitive.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Stop the browser second-guessing declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Leak only the origin to third parties, never the full URL (which carries
  // the permalink fragment's worth of state).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here is meant to be framed.
  { key: "X-Frame-Options", value: "DENY" },
  // Decline hardware APIs the app never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Several lockfiles exist above this directory; pin the root explicitly.
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
