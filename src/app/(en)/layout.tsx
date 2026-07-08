import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter, PT_Serif } from "next/font/google";
import { SiteJsonLd } from "@/components/site-json-ld";
import { CatalogPrefetch } from "@/components/catalog-prefetch";
import "../globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
        <SiteJsonLd />
        <CatalogPrefetch />
        {children}
      </body>
    </html>
  );
}