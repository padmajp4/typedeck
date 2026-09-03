import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Several lockfiles exist above this directory; pin the root explicitly.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
