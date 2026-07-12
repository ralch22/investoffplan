import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getHeroImage } from "@/lib/area-images";
import { getSiteUrl } from "@/lib/site-url";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "تواصل مع فريق invest off-plan — استشارات مجانية حول العقارات على الخارطة في دبي والإمارات عبر الهاتف أو واتساب أو البريد الإلكتروني.",
  alternates: {
    canonical: `${getSiteUrl()}/ar/contact`,
    languages: {
      "x-default": `${getSiteUrl()}/contact`,
      en: `${getSiteUrl()}/contact`,
      ar: `${getSiteUrl()}/ar/contact`,
    },
  },
};

const CHANNELS = [
  {
    label: "واتساب",
    value: "‎+971 58 527 6222",
    href: withUtm("https://wa.me/971585276222", {
      medium: "whatsapp",
      content: "contact_page_ar",
    }),
    note: "الأسرع للرد — أرسل لنا اسم المشروع وسنوافيك بالتفاصيل والبروشور.",
  },
  {
    label: "الهاتف",
    value: "‎+971 44 321 620",
    href: "tel:+97144321620",
    note: "من الأحد إلى الخميس، من 9 صباحاً حتى 6 مساءً بتوقيت دبي.",
  },
  {
    label: "البريد الإلكتروني",
    value: "info@investoffplan.com",
    href: "mailto:info@investoffplan.com",
    note: "للاستفسارات التفصيلية وطلبات المقارنة بين المشاريع.",
  },
];

export default async function ArabicContactPage() {
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="تواصل معنا"
        italicTitle
        subtitle="استشارة مجانية حول الاستثمار في العقارات على الخارطة."
        imageUrl={heroImage}
      />

      {/* PageShell owns the single <main> landmark — avoid nested mains (WCAG 1.3.1). */}
      <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: "/ar" },
            { label: "تواصل معنا" },
          ]}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                {channel.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-text-dark" dir="ltr">
                {channel.value}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{channel.note}</p>
            </a>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-border bg-surface-alt p-8">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            مكتبنا في دبي
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            الخليج التجاري، دبي، الإمارات العربية المتحدة. منصة invest off-plan مدعومة
            من Aria Properties LLC — وساطة عقارية مرخّصة في دبي (رخصة رقم DRN 20678).
          </p>
        </section>
      </section>
    </PageShell>
  );
}
