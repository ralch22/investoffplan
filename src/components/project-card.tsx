"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BrochureButton } from "@/components/brochure-button";
import { BrochureModal } from "@/components/brochure-modal";
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
import { cn } from "@/lib/cn";

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
  const imageUrl = catalog?.imageUrl ?? project.imageUrl;
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const brochureUrl = resolveBrochureUrl(project);
  const ppsf = unitPricePerSqft({ project, unit, catalog });
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || "Payment Plan";
  const statusLabel = isSoldOut ? "Sold out" : project.isPremium ? "Premium" : "Available";
  const unitCount = catalog?.projectUnitCount ?? project.unitCount;
  const unitTypeLabel = unit.propertyType.toLowerCase();

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
          "group relative flex w-full flex-col overflow-hidden rounded-2xl bg-surface-dark shadow-elevation-md transition-all duration-500 hover:-translate-y-1 hover:shadow-elevation-lg",
          featured ? "min-h-[420px] lg:col-span-2" : "min-h-[380px] lg:w-[calc(50%-10px)]",
        )}
      >
        <Link href={`/projects/${project.slug}`} className="absolute inset-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              priority={featured}
              className={cn("object-cover transition-transform duration-700 group-hover:scale-105", isSoldOut && "grayscale-[35%]")}
              sizes={featured ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
            />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br", project.imageGradient)} />
          )}
          <div className="card-photo-overlay absolute inset-0" />
        </Link>

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-text-dark shadow-sm">
                {unitCount} {unitTypeLabel} unit{unitCount === 1 ? "" : "s"}
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

          <div className="mt-auto space-y-3 pt-16">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              {project.developer}
              {handover ? ` · Handover ${handover}` : ""}
            </p>
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
                View Details
              </Link>
              <div className="rounded-full border border-white/40 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                <CompareCheckbox
                  id={compareId}
                  selectedIds={compareIds}
                  onToggle={onCompareToggle}
                  variant="light"
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
  const imageUrl = catalog?.imageUrl ?? project.imageUrl;
  const handover = catalog?.handover ?? project.handover;
  const paymentLabel = catalog?.paymentPlan || project.paymentPlan || "Payment Plan";
  const isSoldOut = (catalog?.status ?? project.status) === "sold-out";
  const unitCount = catalog?.projectUnitCount ?? project.unitCount;
  const unitTypeLabel = unit.propertyType.toLowerCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-elevation-md"
    >
      <div className="flex flex-col md:flex-row">
        <Link
          href={`/projects/${project.slug}`}
          className={cn(
            "relative h-52 w-full shrink-0 md:h-auto md:w-80",
            !imageUrl && `bg-gradient-to-br ${project.imageGradient}`,
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="320px"
            />
          ) : null}
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-text-dark">
            {unitCount} {unitTypeLabel} unit{unitCount === 1 ? "" : "s"}
          </span>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand">
            {paymentLabel}
          </span>
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {project.developer}
                {handover ? ` · ${handover}` : ""}
              </p>
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
              View Details
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