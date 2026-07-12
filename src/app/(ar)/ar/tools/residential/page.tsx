import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { ResidentialPageContent } from "@/app/(en)/tools/residential/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/residential`,
      languages: { "x-default": `${base}/tools/residential`, en: `${base}/tools/residential`, ar: `${base}/ar/tools/residential` },
    },
  };
})();

interface PageProps {
  searchParams: Promise<{ area?: string; q?: string; city?: string }>;
}

export default async function ArResidentialPage({ searchParams }: PageProps) {
  return <ResidentialPageContent locale="ar" searchParams={searchParams} />;
}
