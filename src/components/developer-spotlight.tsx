"use client";

import Link from "next/link";
import { DeveloperLogo } from "@/components/developer-logo";
import { useCatalog } from "@/lib/catalog-browser";

export function DeveloperSpotlight() {
  const { api } = useCatalog();
  const devs = api?.getDevList() ?? [];
  if (!devs.length) return null;

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
      <h2 className="text-xl font-semibold text-slate-900">
        Top developers with live stock
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Project counts synced from Property Finder developer pages
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devs.map((dev) => (
          <Link
            key={dev.id}
            href={`/developers/${dev.slug}`}
            className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <DeveloperLogo
              name={dev.name}
              logoUrl={dev.logoUrl}
              slug={dev.slug}
              size="md"
              rounded="full"
            />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{dev.name}</p>
              {dev.numProjectsOnline != null ? (
                <p className="text-sm text-slate-500">
                  {dev.numProjectsOnline} projects online
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}