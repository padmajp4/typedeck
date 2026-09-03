import type { NextConfig } from "next";

/**
 * The app has no accounts, cookies or server-side state, so these are defence
 * in depth rather than protection of anything sensitive.
 */
const SECURITY_HEADERS = [
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
