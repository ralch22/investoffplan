import type { Metadata } from "next";
import { HomeBody } from "@/components/home/home-body";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "عقارات على الخارطة في الإمارات",
  description:
    "تصفّح آلاف الوحدات على الخارطة مع بروشورات وخطط سداد وأدوات مقارنة وبيانات سوق حيّة من دائرة الأراضي والأملاك في دبي والإمارات.",
  alternates: {
    canonical: `${getSiteUrl()}/ar`,
    languages: { en: getSiteUrl() || "/", ar: `${getSiteUrl()}/ar` },
  },
};

export default function ArabicHomePage() {
  return <HomeBody locale="ar" />;
}
