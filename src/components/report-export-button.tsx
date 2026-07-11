"use client";

import { Gate } from "@/components/auth/gate";
import { useI18n } from "@/i18n/locale-provider";

/**
 * "Export PDF" = gated window.print(). The report page HTML is fully static
 * and identical for everyone (print CSS does the PDF composition) — only this
 * button's ACTION is gated, so there is no cloaking.
 */
export function ReportExportButton() {
  const { dict } = useI18n();

  return (
    <Gate context="pdf-export" onAllowed={() => window.print()}>
      <button
        type="button"
        className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark print:hidden"
      >
        {dict.reports.exportPdf}
      </button>
    </Gate>
  );
}
