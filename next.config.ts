import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { PROJECT_SLUG_REDIRECTS } from "./src/lib/project-slug-renames";
import { COMMUNITY_NICKNAME_ALIASES } from "./src/lib/community-nickname-aliases";

// Top developers 404 on their short brand slug (e.g. /developers/emaar) when the
// canonical detail route is the full slug. Permanent-redirect the aliases so the
// brand shortcut resolves and link equity flows to the canonical page.
const DEVELOPER_ALIASES: Record<string, string> = {
  emaar: "emaar-properties",
  damac: "damac-properties",
  sobha: "sobha-realty",
  aldar: "aldar-properties-pjsc",
  alef: "alef-group",
  reportage: "reportage-real-estate",
  imtiaz: "imtiaz-developments",
  modon: "modon-properties",
  binghatti: "binghatti-developers",
  wasl: "wasl-properties",
  meraas: "meraas-holding",
  azizi: "azizi-developments",
  omniyat: "omniyat-group",
  rak: "rak-properties",
};

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    const devAliases = Object.entries(DEVELOPER_ALIASES).flatMap(([alias, canonical]) => [
      { source: `/developers/${alias}`, destination: `/developers/${canonical}`, permanent: true },
      { source: `/ar/developers/${alias}`, destination: `/ar/developers/${canonical}`, permanent: true },
    ]);
    // Known twin alias forms → permanent canonical PDPs (arthouse / emerge).
    // Bare winner slugs are NOT redirected (no bait-and-switch). See
    // src/lib/project-slug-renames.ts.
    const projectSlugAliases = Object.entries(PROJECT_SLUG_REDIRECTS).flatMap(
      ([alias, canonical]) => [
        {
          source: `/projects/${alias}`,
          destination: `/projects/${canonical}`,
          permanent: true,
        },
        {
          source: `/ar/projects/${alias}`,
          destination: `/ar/projects/${canonical}`,
          permanent: true,
        },
      ],
    );
    // Short community nicknames (jvc, jbr, jlt, dip, …) → canonical community.
    // Complements /areas/[slug] breadcrumb-variant redirects (catalog area
    // slugs only). Map lives in src/lib/community-nickname-aliases.ts.
    // Covers legacy /areas/{nick} and direct /communities/{nick} (EN + AR).
    const communityNickAliases = Object.entries(COMMUNITY_NICKNAME_ALIASES).flatMap(
      ([alias, canonical]) => [
        {
          source: `/areas/${alias}`,
          destination: `/communities/${canonical}`,
          permanent: true,
        },
        {
          source: `/ar/areas/${alias}`,
          destination: `/ar/communities/${canonical}`,
          permanent: true,
        },
        {
          source: `/communities/${alias}`,
          destination: `/communities/${canonical}`,
          permanent: true,
        },
        {
          source: `/ar/communities/${alias}`,
          destination: `/ar/communities/${canonical}`,
          permanent: true,
        },
      ],
    );
    // Bare index paths with no page (only /collections/[slug] and
    // /reports/market/[slug] exist) 404 — send them to the nearest hub instead.
    const indexRedirects = [
      { source: "/collections", destination: "/projects", permanent: false },
      { source: "/ar/collections", destination: "/ar/projects", permanent: false },
      { source: "/reports", destination: "/market-report", permanent: false },
      { source: "/reports/market", destination: "/market-report", permanent: false },
      { source: "/ar/reports", destination: "/ar/market-report", permanent: false },
      // Parity with EN /reports/market → hub (was missing; AR bare path 404'd).
      { source: "/ar/reports/market", destination: "/ar/market-report", permanent: false },
    ];
    return [
      ...devAliases,
      ...projectSlugAliases,
      ...communityNickAliases,
      ...indexRedirects,
    ];
  },
  // Removes the `x-powered-by: Next.js` fingerprint from every response.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Agent discovery (RFC 8288). `describedby` is the registered relation
          // for "a resource describing this one" — which is exactly what
          // /llms.txt is: the canonical, agent-oriented description of the site
          // (catalog stats, DLD data provenance, EN/AR structure). We do NOT
          // advertise an api-catalog/service-desc: the only APIs here are the
          // rate-limited, budget-capped advisor endpoints, which robots.txt
          // deliberately disallows — advertising them would invite abuse.
          { key: "Link", value: '</llms.txt>; rel="describedby"; type="text/plain"' },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
          },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            // 'unsafe-inline' in script-src is required for GTM's injected inline
            // scripts and the Clarity bootstrap snippet. A nonce-based approach
            // would be cleaner but requires middleware on every request and
            // instrumentation of every dangerouslySetInnerHTML call.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://challenges.cloudflare.com",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.clarity.ms https://challenges.cloudflare.com",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://new-projects-media.propertyfinder.com https://i.ytimg.com",
              "frame-src 'self' https://www.openstreetmap.org https://www.youtube-nocookie.com https://challenges.cloudflare.com",
              "frame-ancestors 'self'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      {
        source: "/data/catalog.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/catalog-meta.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/data/catalog-map.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/data/catalog-lite.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/cdn/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/cdn-image-loader.ts",
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    localPatterns: [
      { pathname: "/cdn/**" },
      { pathname: "/brand/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "new-projects-media.propertyfinder.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

// Local `next dev` uses Miniflare by default — ASSETS_R2_BUCKET is empty, so /cdn/* 404s.
// Remote bindings point dev at investoffplan-preview-assets (same bucket as preview Worker).
void initOpenNextCloudflareForDev({
  remoteBindings: process.env.NODE_ENV === "development",
});
