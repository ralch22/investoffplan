"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BrochureButton } from "@/components/brochure-button";
import { BrochureModal } from "@/components/brochure-modal";
import { CompactMediaGallery } from "@/components/compact-media-gallery";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { CompareCheckbox } from "@/components/compare-bar";
import { ContactButton } from "@/components/contact-button";
import { FavoriteButton } from "@/components/favorite-button";
import type { CompareUnitId } from "@/lib/compare";
import type { FlatUnit } from "@/lib/catalog-core";
import type { CurrencyCode } from "@/lib/types";
import {
  formatBeds,
  formatFromPrice,
  formatLaunchPrice,
  formatSqft,
} from "@/lib/format";
import { resolveBrochureUrl } from "@/lib/brochure";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import { getProjectGalleryImages } from "@/lib/project-gallery-images";
import { cn } from "@/lib/cn";
import { interpolate } from "@/i18n";
import { useI18n } from "@/i18n/locale-provider";

function getTypeLabel(raw: string, dict: any): string {
  const f = dict.serp.filters;
  switch (raw) {
    case "apartment":
      return f.apartment;
    case "villa":
      return f.villa;
    case "townhouse":
      return f.townhouse;
    case "penthouse":
      return f.penthouse;
    default:
      return raw;
  }
}

interface ProjectCardProps {
  item: FlatUnit;
  currency: CurrencyCode;
  compareIds: CompareUnitId[];
  onCompareToggle: (id: CompareUnitId) => void;
  layout?: "grid" | "list";
  featured?: boolean;
  index?: number;
}

export function ProjectCard({
  item,
  currency,
  compareIds,
  onCompareToggle,
  layout = "grid",
  featured = false,
  index = 0,
}: ProjectCardProps) {
  const [brochureOpen, setBrochureOpen] = useState(false);
  const { project, unit, catalog } = item;
  const compareId = `${project.id}:${unit.id}` as CompareUnitId;
  const handover = catalog?.handover ?? project.handover;
  const galleryImages = getProjectGalleryImages(project, catalog);
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const brochureUrl = resolveBrochureUrl(project);
  const ppsf = unitPricePerSqft({ project, unit, catalog });
  const { dict } = useI18n();
  const c = dict.common;

  const handoverSuffix = handover ? ` · ${interpolate(c.handover, { date: handover })}` : undefined;
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || c.paymentPlan;
  const statusLabel = isSoldOut
    ? c.soldOut
    : project.isPremium
      ? c.premium
      : c.available;
  const unitCountNum = catalog?.projectUnitCount ?? project.unitCount;
  const unitTypeRaw = unit.propertyType.toLowerCase();
  const unitTypeLabel = getTypeLabel(unitTypeRaw, dict);
  const unitCountLabel =
    unitCountNum === 1
      ? interpolate(c.unitCountSingular, { count: unitCountNum, type: unitTypeLabel })
      : interpolate(c.unitCountPlural, { count: unitCountNum, type: unitTypeLabel });

  if (layout === "list") {
    return (
      <ListCard
        item={item}
        currency={currency}
        compareIds={compareIds}
        onCompareToggle={onCompareToggle}
        index={index}
      />
    );
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
        className={cn(
          "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-dark shadow-elevation-md transition-all duration-500 hover:-translate-y-1 hover:shadow-elevation-lg",
          featured ? "lg:col-span-2" : "lg:w-[calc(50%-10px)]",
        )}
      >
        <div className={cn("relative w-full shrink-0", featured ? "h-64 md:h-72" : "h-52 md:h-56")}>
          <CompactMediaGallery
            images={galleryImages}
            alt={project.name}
            projectHref={`/projects/${project.slug}`}
            fallbackClassName={cn("bg-gradient-to-br", project.imageGradient)}
            priority={featured}
            soldOutGrayscale={isSoldOut}
            sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, 400px"}
            className="rounded-none"
          />
        </div>

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-text-dark shadow-sm">
                {unitCountLabel}
              </span>
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {paymentLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="glass-pill rounded-full px-3 py-1 text-xs font-medium text-white">
                {statusLabel}
              </span>
              <FavoriteButton slug={project.slug} variant="light" />
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <DeveloperAttribution
              name={project.developer}
              logoUrl={project.developerLogo}
              suffix={handoverSuffix}
              variant="light"
            />
            <h3 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
              <Link href={`/projects/${project.slug}`} className="hover:text-white/90">
                {project.name}
              </Link>
            </h3>
            <p className="line-clamp-2 text-sm text-white/80">
              {formatBeds(unit.beds)} · {formatSqft(unit.sqftMin, unit.sqftMax)} ·{" "}
              {unit.propertyType}
              {ppsf ? ` · AED ${ppsf.toLocaleString()}/sqft` : ""}
            </p>
            <p className="text-xl font-bold text-white">
              from{" "}
              {formatFromPrice(unit.launchPriceAed, unit.launchPriceMaxAed, currency)}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={`/projects/${project.slug}`}
                className="rounded-full border border-white/80 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-text-dark"
              >
                {c.viewDetails}
              </Link>
              <div className="rounded-full border border-white/40 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <CompareCheckbox
                  id={compareId}
                  selectedIds={compareIds}
                  onToggle={onCompareToggle}
                  variant="light"
                  label={project.name}
                />
              </div>
              <ContactButton
                phone={catalog?.whatsapp ?? project.whatsapp}
                projectName={project.name}
                className="rounded-full border border-white/80 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-text-dark"
              />
              <BrochureButton
                url={brochureUrl ?? "#brochure-request"}
                projectName={project.name}
                onOpenModal={() => setBrochureOpen(true)}
                variant="ghost-light"
              />
            </div>
          </div>
        </div>
      </motion.article>

      <BrochureModal
        open={brochureOpen}
        onClose={() => setBrochureOpen(false)}
        projectName={project.name}
        projectSlug={project.slug}
        brochureUrl={brochureUrl ?? "#brochure-request"}
        whatsapp={catalog?.whatsapp ?? project.whatsapp}
      />
    </>
  );
}

function ListCard({
  item,
  currency,
  compareIds,
  onCompareToggle,
  index = 0,
}: Omit<ProjectCardProps, "layout" | "featured">) {
  const { project, unit, catalog } = item;
  const compareId = `${project.id}:${unit.id}` as CompareUnitId;
  const galleryImages = getProjectGalleryImages(project, catalog);
  const handover = catalog?.handover ?? project.handover;
  const { dict } = useI18n();
  const c = dict.common;
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || c.paymentPlan;
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const unitCountNum = catalog?.projectUnitCount ?? project.unitCount;
  const unitTypeRaw = unit.propertyType.toLowerCase();
  const unitTypeLabel = getTypeLabel(unitTypeRaw, dict);
  const unitCountLabel =
    unitCountNum === 1
      ? interpolate(c.unitCountSingular, { count: unitCountNum, type: unitTypeLabel })
      : interpolate(c.unitCountPlural, { count: unitCountNum, type: unitTypeLabel });

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-elevation-md"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative h-52 w-full shrink-0 md:h-auto md:w-80">
          <CompactMediaGallery
            images={galleryImages}
            alt={project.name}
            projectHref={`/projects/${project.slug}`}
            fallbackClassName={cn("bg-gradient-to-br", project.imageGradient)}
            sizes="320px"
            className="h-full rounded-none md:rounded-s-2xl"
          />
          <span className="pointer-events-none absolute start-4 top-4 z-30 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-text-dark">
            {unitCountLabel}
          </span>
          <span className="pointer-events-none absolute bottom-4 start-4 z-30 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand">
            {paymentLabel}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DeveloperAttribution
                name={project.developer}
                logoUrl={project.developerLogo ?? catalog?.developerLogo}
                suffix={handover ? ` · ${handover}` : undefined}
              />
              <h3 className="mt-1 text-xl font-semibold text-text-dark">
                <Link href={`/projects/${project.slug}`} className="hover:text-brand">
                  {project.name}
                </Link>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton slug={project.slug} />
              <CompareCheckbox
                id={compareId}
                selectedIds={compareIds}
                onToggle={onCompareToggle}
                label={project.name}
              />
            </div>
          </div>
          <p className="text-sm text-muted">
            {formatBeds(unit.beds)} · {formatSqft(unit.sqftMin, unit.sqftMax)} ·{" "}
            {unit.propertyType}
          </p>
          <p className="text-lg font-semibold text-brand">
            from{" "}
            {formatLaunchPrice(unit.launchPriceAed, unit.launchPriceMaxAed, currency)}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Link
              href={`/projects/${project.slug}`}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {c.viewDetails}
            </Link>
            <ContactButton
              phone={catalog?.whatsapp ?? project.whatsapp}
              projectName={project.name}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}