import type { Metadata } from "next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { SiteJsonLd } from "@/components/site-json-ld";
import { CatalogPrefetch } from "@/components/catalog-prefetch";
import { LocaleProvider } from "@/i18n/locale-provider";
import { getDictionary } from "@/i18n";
import "../../globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Latin fallback for prices, brand name, and phone numbers.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "invest off-plan | عقارات على الخارطة في الإمارات",
    template: "%s | invest off-plan",
  },
  description:
    "منصة العقارات على الخارطة الرائدة في الإمارات — أسعار على مستوى الوحدة، خطط سداد، كتيّبات، واستشارات متخصصة.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://investoffplan-preview.emerge-digital.workers.dev",
  ),
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

export default function ArabicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = getDictionary("ar");

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
        <SiteJsonLd />
        <CatalogPrefetch />
        <LocaleProvider locale="ar" dict={dict}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
