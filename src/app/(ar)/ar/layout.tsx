import type { Metadata, Viewport } from "next";

// viewport-fit=cover: without it env(safe-area-inset-bottom) is 0 on iPhone,
// so the bottom tab bar would sit under the home indicator.
export const viewport: Viewport = { viewportFit: "cover" };
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { Clarity } from "@/components/clarity";
import { SiteJsonLd } from "@/components/site-json-ld";
import { CatalogPrefetch } from "@/components/catalog-prefetch";
import { MotionProvider } from "@/components/motion-provider";
import { NavDataProvider } from "@/components/nav/nav-data-provider";
import { getNavCommunities } from "@/lib/nav-data";
import { getSiteUrl } from "@/lib/site-url";
import { LocaleProvider } from "@/i18n/locale-provider";
import { getDictionary } from "@/i18n";
import "../../globals.css";

// Match the EN layout: hourly ISR so deploys reach the CDN edge within an hour.
export const revalidate = 3600;

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Latin fallback for prices, brand name, and phone numbers.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "invest off-plan | عقارات على الخارطة في الإمارات",
    template: "%s | invest off-plan",
  },
  description:
    "منصة العقارات على الخارطة الرائدة في الإمارات — أسعار على مستوى الوحدة، خطط سداد، كتيّبات، واستشارات متخصصة.",
  // getSiteUrl() defaults to the apex — a missing env var must not leak the
  // preview domain into canonical/og URLs site-wide.
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    siteName: "invest off-plan",
    locale: "ar_AE",
    type: "website",
    title: "invest off-plan | عقارات على الخارطة في الإمارات",
    description:
      "منصة العقارات على الخارطة الرائدة في الإمارات — أسعار على مستوى الوحدة، خطط سداد، وكتيّبات.",
    images: [
      { url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" },
    ],
  },
  icons: {
    icon: [
      { url: "/brand/icon-red.svg", type: "image/svg+xml" },
      { url: "/brand/icon-red.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/brand/icon-red.png",
  },
};

export default async function ArabicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = getDictionary("ar");
  const topCommunities = await getNavCommunities();

  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${plexArabic.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        <Clarity />
        <SiteJsonLd />
        <CatalogPrefetch />
        <LocaleProvider locale="ar" dict={dict}>
          <NavDataProvider topCommunities={topCommunities}>
            <MotionProvider>{children}</MotionProvider>
          </NavDataProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
