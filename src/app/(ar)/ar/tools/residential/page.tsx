import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { ResidentialPageContent } from "@/app/(en)/tools/residential/page";

export const metadata: Metadata = arMeta({
  path: "/tools/residential",
  title: "رؤى سكنية في دبي — أسعار الإطلاق والدرهم/قدم",
  description:
    "ذكاء أسعار الإطلاق لكل مشروع على الخارطة — المتوسطات، السعر للقدم المربع، وروابط لصفحات المشاريع.",
});

interface PageProps {
  searchParams: Promise<{ area?: string; q?: string; city?: string }>;
}

export default async function ArResidentialPage({ searchParams }: PageProps) {
  return <ResidentialPageContent locale="ar" searchParams={searchParams} />;
}
