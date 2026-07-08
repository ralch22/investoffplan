import { getAdvantageMatrix } from "@/lib/catalog-analytics";
import { getSiteStats } from "@/lib/catalog";

export async function AdvantageMatrix() {
  const stats = await getSiteStats();
  const rows = getAdvantageMatrix(stats.unitCount);

  return (
    <section className="bg-surface-alt py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 className="font-display text-center text-3xl font-semibold text-text-dark md:text-4xl">
          Better than Property Finder + opr.ae{" "}
          <em className="italic">combined.</em>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          One platform with PF&apos;s full unit catalog, opr.ae&apos;s brochure UX, and
          intelligence neither offers.
        </p>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[rgba(192,212,232,0.5)] bg-white">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-border bg-brand/5">
              <tr>
                <th className="px-5 py-4 font-semibold text-text-dark">Feature</th>
                <th className="px-5 py-4 text-center font-semibold text-muted">
                  Property Finder
                </th>
                <th className="px-5 py-4 text-center font-semibold text-muted">
                  opr.ae
                </th>
                <th className="px-5 py-4 text-center font-semibold text-brand">
                  invest off-plan
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-medium text-text-dark">{row.feature}</td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.pf} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.opr} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.iop} highlight />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Cell({ value, highlight }: { value: boolean; highlight?: boolean }) {
  if (value) {
    return (
      <span
        className={
          highlight
            ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
            : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt text-sm text-text-dark"
        }
      >
        ✓
      </span>
    );
  }
  return <span className="text-muted">—</span>;
}