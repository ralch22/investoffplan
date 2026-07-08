import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
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
      // Enrichment gallery images are discovered on arbitrary official developer
      // domains (issue #37), so the optimizer must accept any https host.
      {
        protocol: "https",
        hostname: "**",
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
