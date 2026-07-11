import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import NewsPage from "@/app/(en)/news/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider;
// the locale prop localizes internal links and dates.
export default function ArabicNewsPage() {
  return <NewsPage locale="ar" />;
}

export const metadata: Metadata = arMeta({
  path: "/news",
  title: "أخبار العقارات على الخارطة في الإمارات",
  description:
    "أحدث أخبار وتحديثات سوق العقارات على الخارطة في دبي والإمارات.",
});
