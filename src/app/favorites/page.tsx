import type { Metadata } from "next";
import { FavoritesPage } from "./favorites-page";

export const metadata: Metadata = {
  title: "My favorites",
  description: "Your saved off-plan properties on invest off-plan.",
};

export default function Page() {
  return <FavoritesPage />;
}