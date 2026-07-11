import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getHeroImage } from "@/lib/area-images";
import { getSiteStats } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "تعرّف على منصة invest off-plan — منصة ذكاء عقاري تجمع كل وحدات المشاريع على الخارطة في الإمارات مع البروشورات وخطط السداد وأدوات المقارنة.",
  alternates: {
    canonical: `${getSiteUrl()}/ar/about`,
    languages: {
      en: `${getSiteUrl()}/about`,
      ar: `${getSiteUrl()}/ar/about`,
    },
  },
};

export default async function ArabicAboutPage() {
  const heroImage = await getHeroImage();
  const stats = await getSiteStats();

  const pillars = [
    {
      name: "ذكاء الكتالوج",
      role: `${stats.unitCount.toLocaleString()} خيار وحدة`,
    },
    { name: "بروشورات فورية", role: "PDF أو عبر واتساب" },
    { name: "أدوات المقارنة", role: "حتى 3 وحدات جنباً إلى جنب" },
    { name: "تحليلات السوق", role: "بيانات حيّة محدّثة أسبوعياً" },
  ];

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="متخصصون في العقارات على الخارطة"
        italicTitle
        subtitle="تعرّف على فريق invest off-plan."
        imageUrl={heroImage}
      >
        <PrimaryButton href="/projects">ابدأ الآن</PrimaryButton>
      </PageHero>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <h2 className="font-display text-3xl font-semibold text-text-dark">
          عن <em className="italic">invest off-plan.</em>
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted">
          أنشأنا invest off-plan لنمنح المشترين في الإمارات مكاناً واحداً لتصفّح كل
          وحدات المشاريع على الخارطة، وتحميل البروشورات، ومقارنة خطط السداد، واستكشاف
          المشاريع على خريطة تفاعلية — مع ذكاء سعر القدم المربعة الذي يتجاوز ما تقدّمه
          البوابات العقارية التقليدية.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-2xl border border-border bg-surface-alt p-6"
            >
              <div className="flex h-24 items-center justify-center rounded-xl bg-brand/10 text-2xl font-bold text-brand">
                IOP
              </div>
              <p className="mt-4 font-semibold text-text-dark">{pillar.name}</p>
              <p className="mt-1 text-sm text-muted">{pillar.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold">
            تجارب عملائنا<span className="text-brand">.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">
            يعتمد المشترون على invest off-plan لاختصار قائمة المشاريع بسرعة — مع
            البروشورات ومواعيد التسليم والأسعار على مستوى الوحدة في مسار عمل واحد.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
