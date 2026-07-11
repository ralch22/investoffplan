import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { arMeta } from "@/lib/ar-meta";

export const metadata: Metadata = arMeta({
  path: "/cookie-policy",
  title: "سياسة ملفات تعريف الارتباط",
  description:
    "كيف تستخدم منصة invest off-plan ملفات تعريف الارتباط والتخزين المحلي للمفضلة والمقارنة وتفضيلات العملة.",
});

export default function ArabicCookiePolicyPage() {
  return (
    <PageShell>
      <PageHero
        title="سياسة ملفات تعريف الارتباط"
        subtitle="كيف نستخدم ملفات تعريف الارتباط والتخزين المحلي"
        align="left"
      />
      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: "/ar" },
            { label: "سياسة ملفات تعريف الارتباط" },
          ]}
        />
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            تستخدم منصة invest off-plan ملفات تعريف الارتباط الأساسية والتخزين المحلي في
            المتصفّح لتذكّر تفضيل العملة لديك واختياراتك في المقارنة وعقاراتك المفضلة.
          </p>
          <p>
            قد نستخدم أدوات تحليلات تحترم الخصوصية لفهم الصفحات والفلاتر التي تساعد
            المشترين على اكتشاف المخزون على الخارطة بكفاءة أكبر. إلى جانب Google
            Analytics، قد نستخدم Microsoft Clarity لجمع خرائط حرارية مجهّلة للجلسات توضّح
            كيفية تفاعل الزوّار مع صفحاتنا.
          </p>
          <p>
            يمكنك مسح المفضلة وبيانات المقارنة في أي وقت من خلال إعدادات متصفّحك أو عبر
            أزرار المسح على الموقع.
          </p>
        </div>
      </main>
    </PageShell>
  );
}
