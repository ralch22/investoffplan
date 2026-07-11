import type { Metadata } from "next";
import { AccountPage } from "./account-page";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your invest off-plan profile, saved searches, and favorites.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountPage />;
}
