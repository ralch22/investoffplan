"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/catalog-browser";

export function KnownDevelopers() {
  const { api } = useCatalog();
  const links = api?.meta.developerSerpLinks;
  if (!links?.length) return null;

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="text-xl font-semibold text-slate-900">
        Projects by Known Developers in UAE
      </h2>
      <div className="mt-6 columns-1 gap-x-8 text-sm text-slate-700 sm:columns-2 lg:columns-3">
        {links.map((link) => {
          const slug = link.path.split("/dev/")[1]?.replace(/\/$/, "");
          return (
            <Link
              key={link.path}
              href={slug ? `/developers/${slug}` : "/developers"}
              className="mb-2 block text-teal-700 hover:text-teal-900 hover:underline"
            >
              {link.title}
            </Link>
          );
        })}
      </div>
    </section>
  );
}