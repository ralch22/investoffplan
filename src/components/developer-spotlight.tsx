"use client";

import Image from "next/image";
import Link from "next/link";
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devs.map((dev) => (
          <Link
            key={dev.id}
            href={`/developers/${dev.slug}`}
            className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50"
          >
            {dev.logoUrl ? (
              <Image
                src={dev.logoUrl}
                alt={dev.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-contain"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {dev.name.slice(0, 2).toUpperCase()}
              </span>
            )}
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