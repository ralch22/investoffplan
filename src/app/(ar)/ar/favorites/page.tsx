import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider,
// which feeds the Arabic dictionary into the client <FavoritesPage>.
export { default } from "@/app/(en)/favorites/page";

export const metadata: Metadata = arMeta({
  path: "/favorites",
  title: "المفضلة لديّ",
  description: "العقارات على الخارطة التي حفظتها على invest off-plan.",
});
