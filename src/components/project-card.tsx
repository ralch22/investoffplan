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
import { PaymentRibbon } from "@/components/payment-ribbon";
import type { CompareUnitId } from "@/lib/compare";
import type { FlatUnit } from "@/lib/catalog-core";
import type { CurrencyCode } from "@/lib/types";
import {
  bedsLabel,
  formatFromPrice,
  formatLaunchPrice,
  formatPricePerSqft,
  formatSqft,
  propertyTypeLabel,
} from "@/lib/format";
import { resolveBrochureUrl } from "@/lib/brochure";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import { getProjectGalleryImages } from "@/lib/project-gallery-images";
import { cardEntrance, cardHoverLift } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";
import type { Dict } from "@/i18n";

/** "{count} apartment units" — localized count + property-type noun. */
function unitCountLabel(
  dict: Dict,
  locale: string,
  count: number,
  propertyType: string,
): string {
  const key = propertyType.toLowerCase();
  const typeNames: Record<string, string> = {
    apartment: dict.serp.filters.apartment,
    villa: dict.serp.filters.villa,
    townhouse: dict.serp.filters.townhouse,
    penthouse: dict.serp.filters.penthouse,
  };
  // EN keeps the current lowercased raw type so visible text stays identical.
  const type = locale === "ar" ? (typeNames[key] ?? propertyType) : key;
  return interpolate(
    count === 1 ? dict.common.unitCountSingular : dict.common.unitCountPlural,
    { count, type },
  );
}

interface ProjectCardProps {
  item: FlatUnit;
  currency: CurrencyCode;
  compareIds: CompareUnitId[];
  onCompareToggle: (id: CompareUnitId) => void;
  layout?: "grid" | "list";
  featured?: boolean;
  /**
   * True when this card was surfaced by a PAID placement (serp-boost). Renders
   * the existing Premium label style with the text "Featured" — paid slots are
   * always visibly labeled (ad disclosure).
   */
  placed?: boolean;
  index?: number;
}

export function ProjectCard({
  item,
  currency,
  compareIds,
  onCompareToggle,
  layout = "grid",
  featured = false,
  placed = false,
  index = 0,
}: ProjectCardProps) {
  const [brochureOpen, setBrochureOpen] = useState(false);
  const { locale, dict } = useI18n();
  const { project, unit, catalog } = item;
  const compareId = `${project.id}:${unit.id}` as CompareUnitId;
  const handover = catalog?.handover ?? project.handover;
  const galleryImages = getProjectGalleryImages(project, catalog);
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const brochureUrl = resolveBrochureUrl(project);
  const ppsf = unitPricePerSqft({ project, unit, catalog });
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || "Payment Plan";
  const isPlaced = placed || Boolean(item.placed);
  const statusLabel = isSoldOut
    ? dict.common.soldOut
    : isPlaced
      ? dict.common.featured
      : project.isPremium
        ? dict.common.premium
        : dict.common.available;
  const unitCount = catalog?.projectUnitCount ?? project.unitCount;

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
        {...cardEntrance(index)}
        {...cardHoverLift}
        className={cn(
          "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-dark shadow-elevation-md transition-shadow duration-500 hover:shadow-elevation-lg",
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
          {paymentLabel !== "Payment Plan" ? <PaymentRibbon label={paymentLabel} /> : null}
        </div>

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-text-dark shadow-sm">
                {unitCountLabel(dict, locale, unitCount, unit.propertyType)}
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
              variant="light"
            />
            {handover ? (
              <p className="font-display text-sm italic text-white/85">
                {interpolate(dict.common.handover, { date: handover })}
              </p>
            ) : null}
            <h3 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
              <Link href={localePath(locale, `/projects/${project.slug}`)} className="hover:text-white/90">
                {project.name}
              </Link>
            </h3>
            <p className="line-clamp-1 text-sm font-medium text-white/75">
              {project.area.split(",").slice(0, 2).join(", ")}
            </p>
            <p className="line-clamp-2 text-sm text-white/80">
              {bedsLabel(unit.beds, dict)} · {formatSqft(unit.sqftMin, unit.sqftMax)} ·{" "}
              {propertyTypeLabel(unit.propertyType, dict, locale)}
              {ppsf ? ` · ${formatPricePerSqft(ppsf, currency)}` : ""}
            </p>
            <p className="text-xl font-bold text-white">
              {formatFromPrice(unit.launchPriceAed, unit.launchPriceMaxAed, currency)}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={localePath(locale, `/projects/${project.slug}`)}
                className="iop-btn-press focus-ring rounded-full border border-white/80 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-text-dark"
              >
                {dict.common.viewDetails}
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
                className="iop-btn-press focus-ring rounded-full border border-white/80 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-text-dark"
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
  const { locale, dict } = useI18n();
  const { project, unit, catalog } = item;
  const compareId = `${project.id}:${unit.id}` as CompareUnitId;
  const galleryImages = getProjectGalleryImages(project, catalog);
  const handover = catalog?.handover ?? project.handover;
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || "Payment Plan";
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const unitCount = catalog?.projectUnitCount ?? project.unitCount;

  return (
    <motion.article
      {...cardEntrance(index)}
      {...cardHoverLift}
      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow duration-500 hover:shadow-elevation-md"
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
            {unitCountLabel(dict, locale, unitCount, unit.propertyType)}
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
                <Link href={localePath(locale, `/projects/${project.slug}`)} className="hover:text-brand">
                  {project.name}
                </Link>
              </h3>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                {project.area.split(",").slice(0, 2).join(", ")}
              </p>
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
            {bedsLabel(unit.beds, dict)} · {formatSqft(unit.sqftMin, unit.sqftMax)} ·{" "}
            {propertyTypeLabel(unit.propertyType, dict, locale)}
          </p>
          <p className="text-lg font-semibold text-brand">
            {formatFromPrice(unit.launchPriceAed, unit.launchPriceMaxAed, currency)}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Link
              href={localePath(locale, `/projects/${project.slug}`)}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {dict.common.viewDetails}
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