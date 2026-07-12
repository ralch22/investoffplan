import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import DevelopersPage from "@/app/(en)/developers/page";

export const dynamicParams = false;

export const metadata: Metadata = arMeta({
  path: "/developers",
  title: "المطوّرون العقاريون على الخارطة في الإمارات",
  description:
    "تصفّح المطوّرين العقاريين على الخارطة في الإمارات مع كتالوج المشاريع وأسعار الإطلاق وخطط السداد والبروشورات.",
});

export default async function ArDevelopersPage() {
  return <DevelopersPage locale="ar" />;
}
