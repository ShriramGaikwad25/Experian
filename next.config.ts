import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/basePath";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  // Self-contained server bundle (.next/standalone) for offline deployment: no npm install on the target.
  output: "standalone",
  // Serve /public images as-is: avoids the native `sharp` dependency so a bundle built on Windows runs on Linux.
  images: { unoptimized: true },
  // ...and keep sharp's OS-specific binaries out of the standalone bundle (never loaded with unoptimized images).
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
  // Whole app is served under /kfidp (sign-in: /kfidp/{TenantId})
  basePath: BASE_PATH,
  async redirects() {
    return [
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
    ];
  },
  // All images are served from /public; no remote hosts are allowed through the optimizer.
  // Content-Security-Policy is set per request in middleware.ts (it carries a nonce).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
  // ESLint during build: configure via eslint.config.mjs and run `npm run lint` separately (Next.js 16+).
  // Add empty turbopack config to silence warnings
  turbopack: {},
};

export default nextConfig;
