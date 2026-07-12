import type { Metadata } from "next";
import { FavoritesPage } from "./favorites-page";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "My favorites",
  description: "Your saved off-plan properties on invest off-plan.",
  // User-state page — no unique public content; keep out of the index.
  robots: { index: false, follow: false },
  alternates: enMeta("/favorites"),
};

export default function Page() {
  return <FavoritesPage />;
}