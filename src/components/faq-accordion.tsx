export interface FaqEntry {
  q: string;
  a: string;
}

/** Shared FAQ accordion — the single source of the `.faq-details` markup. */
export function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details
          key={faq.q}
          className="faq-details rounded-2xl border border-border bg-white p-5 transition"
        >
          <summary className="cursor-pointer font-semibold text-text-dark">
            {faq.q}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
