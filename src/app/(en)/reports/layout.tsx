import { SignInModalHost } from "@/components/auth/sign-in-modal-host";

// Minimal standalone layout for printable /reports pages: no SiteHeader,
// SiteFooter, AdvisorWidget, or BottomTabBar (PageShell is intentionally not
// used) so window.print() yields a clean document. Fonts/analytics/global CSS
// come from the parent (en) layout. SignInModalHost stands in for the header's
// UserMenu as the sign-in-bus listener (the pdf-export gate needs a modal).
export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="report-only min-h-screen bg-white">
      {children}
      <SignInModalHost />
    </div>
  );
}
