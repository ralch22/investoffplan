"use client";

import { LocaleLink } from "@/components/locale-link";
import { DeveloperLogo } from "@/components/developer-logo";
import { useCatalog } from "@/lib/catalog-browser";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";
import { motion } from "framer-motion";
import { cardEntrance } from "@/lib/motion";

export function DeveloperSpotlight() {
  const { api } = useCatalog();
  const { dict } = useI18n();
  const t = dict.serp.developerSpotlight;
  const devs = api?.getDevList() ?? [];
  if (!devs.length) return null;

  return (
    <motion.section 
      {...cardEntrance(0)}
      className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
    >
      <h2 className="text-xl font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devs.map((dev, i) => (
          <LocaleLink
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
                  {interpolate(t.projectsOnline, {
                    count: dev.numProjectsOnline,
                  })}
                </p>
              ) : null}
            </div>
          </LocaleLink>
        ))}
      </div>
    </motion.section>
  );
}
