import type { Metadata, Viewport } from "next";

// viewport-fit=cover: without it env(safe-area-inset-bottom) is 0 on iPhone,
// so the bottom tab bar would sit under the home indicator.
export const viewport: Viewport = { viewportFit: "cover" };
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Inter, PT_Serif } from "next/font/google";
import { SiteJsonLd } from "@/components/site-json-ld";
import { CatalogPrefetch } from "@/components/catalog-prefetch";
import { MotionProvider } from "@/components/motion-provider";
import { NavDataProvider } from "@/components/nav/nav-data-provider";
import { getNavCommunities } from "@/lib/nav-data";
import "../globals.css";

// Re-render at most hourly so a deploy's fresh content reaches the CDN edge
// within an hour instead of being pinned by the SSG default (s-maxage=1yr).
export const revalidate = 3600;

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "invest off-plan | UAE Off-Plan Properties",
    template: "%s | invest off-plan",
  },
  description:
    "UAE's leading off-plan property platform. Browse unit-level pricing, payment plans, brochures, and expert consultation.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://investoffplan-preview.emerge-digital.workers.dev",
  ),
  openGraph: {
    siteName: "invest off-plan",
    locale: "en_AE",
    type: "website",
    title: "invest off-plan | UAE Off-Plan Properties",
    description:
      "UAE's leading off-plan property platform. Browse unit-level pricing, payment plans, brochures, and expert consultation.",
    images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "invest off-plan | UAE Off-Plan Properties",
    description:
      "UAE's leading off-plan property platform. Browse unit-level pricing, payment plans, brochures, and expert consultation.",
    images: ["/brand/icon-red.png"],
  },
  icons: {
    icon: [
      { url: "/brand/icon-red.svg", type: "image/svg+xml" },
      { url: "/brand/icon-red.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/brand/icon-red.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const topCommunities = await getNavCommunities();
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        <SiteJsonLd />
        <CatalogPrefetch />
        <NavDataProvider topCommunities={topCommunities}>
          <MotionProvider>{children}</MotionProvider>
        </NavDataProvider>
      </body>
    </html>
  );
}