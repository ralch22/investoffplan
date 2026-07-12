import { SignInModalHost } from "@/components/auth/sign-in-modal-host";

// AR mirror of the chrome-less printable /reports layout (#245).
// Fonts/analytics/global CSS come from the parent (ar) layout.
export default function ArReportsLayout({
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
