import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { LocationsPageContent } from "@/app/(en)/locations/page";

export const metadata: Metadata = arMeta({
  path: "/locations",
  title: "أدلة مناطق دبي — مجتمعات مرتّبة بحسب بيانات حقيقية",
  description:
    "أين تشتري عقارات على الخارطة في دبي: مجتمعات مرتّبة بناءً على بيانات دائرة الأراضي والأملاك — الأفضل للعائلات، أعلى عوائد إيجارية، أفضل قيمة للقدم المربع، والأكثر سيولة لإعادة البيع.",
});

export default function ArLocationsPage() {
  return <LocationsPageContent locale="ar" />;
}
