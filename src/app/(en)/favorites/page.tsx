import type { Metadata } from "next";
import { FavoritesPage } from "./favorites-page";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "My favorites",
  description: "Your saved off-plan properties on invest off-plan.",
  alternates: enMeta("/favorites"),
};

export default function Page() {
  return <FavoritesPage />;
}