import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { BrandLogo } from "@/components/brand-logo";
import { PageShell } from "@/components/page-shell";
import { PrimaryButton } from "@/components/ui/primary-button";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "تعذّر العثور على هذه الصفحة. تصفّح مشاريع العقارات على الخارطة في الإمارات على invest off-plan.",
  robots: { index: false, follow: true },
};

export default function ArabicNotFound() {
  return (
    <PageShell>
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-24 text-center md:px-8">
        <BrandLogo variant="icon-red" className="h-14 w-14" />
        <p className="mt-6 text-6xl font-semibold tabular-nums text-brand">404</p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-text-dark">
          الصفحة غير موجودة
        </h1>
        <p className="prose-balance mt-3 text-muted">
          قد لا يكون هذا المشروع أو المنطقة أو المطوّر ضمن كتالوجنا بعد. جرّب البحث في
          المخزون الكامل بدلاً من ذلك.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/ar/projects">تصفّح المشاريع</PrimaryButton>
          <LocaleLink
            href="/"
            className="iop-btn-press focus-ring inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
          >
            العودة للرئيسية
          </LocaleLink>
        </div>
      </main>
    </PageShell>
  );
}
