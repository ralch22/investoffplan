import type { Metadata } from "next";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/account/page";

export const metadata: Metadata = {
  title: "حسابي",
  description: "إدارة ملفك الشخصي وعمليات البحث المحفوظة والمفضلة على invest off-plan.",
  robots: { index: false, follow: false },
};
