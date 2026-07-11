import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { arMeta } from "@/lib/ar-meta";

export const metadata: Metadata = arMeta({
  path: "/privacy-policy",
  title: "سياسة الخصوصية",
  description:
    "كيف تجمع منصة invest off-plan بيانات التواصل وبيانات التصفّح الخاصة بك وتستخدمها وتحميها.",
});

export default function ArabicPrivacyPolicyPage() {
  return (
    <PageShell>
      <PageHero title="سياسة الخصوصية" subtitle="كيف نتعامل مع بياناتك" align="left" />
      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: "/ar" },
            { label: "سياسة الخصوصية" },
          ]}
        />
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            تجمع منصة invest off-plan بيانات التواصل التي ترسلها عبر طلبات البروشورات
            ونماذج الاستشارة والاشتراك في النشرة البريدية، وذلك فقط للرد على استفساراتك
            العقارية.
          </p>
          <p>
            نحن لا نبيع البيانات الشخصية. تُجمع تحليلات الكتالوج العام (فلاتر البحث،
            استخدام أداة المقارنة) بشكل مُجمّع وتُستخدم لتحسين تجربة المنصة.
          </p>
          <p>
            لطلبات الوصول إلى بياناتك أو حذفها، تواصل معنا عبر info@investoffplan.com.
          </p>
        </div>
      </main>
    </PageShell>
  );
}
