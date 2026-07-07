"use client";

import Link from "next/link";
import { DeveloperLogo } from "@/components/developer-logo";
import { useCatalog } from "@/lib/catalog-browser";

export function KnownDevelopers() {
  const { api } = useCatalog();
  const devs = api?.getDevList() ?? [];
  if (!devs.length) return null;

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="text-xl font-semibold text-slate-900">
        Projects by Known Developers in UAE
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devs.map((dev) => (
          <Link
            key={dev.id}
            href={`/developers/${dev.slug}`}
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 hover:text-teal-900"
          >
            <DeveloperLogo
              name={dev.name}
              logoUrl={dev.logoUrl}
              slug={dev.slug}
              size="sm"
              rounded="full"
            />
            <span className="font-medium">{dev.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}