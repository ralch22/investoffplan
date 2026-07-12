import type { Metadata, Viewport } from "next";

// viewport-fit=cover: without it env(safe-area-inset-bottom) is 0 on iPhone,
// so the bottom tab bar would sit under the home indicator.
export const viewport: Viewport = { viewportFit: "cover" };
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { Inter, PT_Serif } from "next/font/google";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SiteJsonLd } from "@/components/site-json-ld";
import { CatalogPrefetch } from "@/components/catalog-prefetch";
import { MotionProvider } from "@/components/motion-provider";
import { NavDataProvider } from "@/components/nav/nav-data-provider";
import { getNavCommunities } from "@/lib/nav-data";
import { getSiteUrl } from "@/lib/site-url";
import "../globals.css";

// Re-render at most hourly so a deploy's fresh content reaches the CDN edge
// within an hour instead of being pinned by the SSG default (s-maxage=1yr).
export const revalidate = 3600;

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

// Variable font (no explicit `weight`) → one woff2 covering the full weight
// axis instead of four static instances preloaded on every page. All the
// weights the UI uses (400/500/600/700) are still available. PT_Serif has no
// variable version on Google Fonts, so it keeps explicit weights below.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
  // getSiteUrl() defaults to the apex — a missing env var must not leak the
  // preview domain into canonical/og URLs site-wide.
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    siteName: "invest off-plan",
    locale: "en_US",
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
        {/* Consent Mode v2: default all signals to denied before GA/GTM load.
            GA/GTM operate in cookieless mode until the user accepts. */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
        `}</Script>
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        <CookieConsentBanner />
        <SiteJsonLd />
        <CatalogPrefetch />
        <NavDataProvider topCommunities={topCommunities}>
          <MotionProvider>{children}</MotionProvider>
        </NavDataProvider>
      </body>
    </html>
  );
}