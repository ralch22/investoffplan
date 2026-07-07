"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FavoriteButton } from "@/components/favorite-button";
import type { Project } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

interface ShowcaseProjectCardProps {
  project: Project;
  featured?: boolean;
  dark?: boolean;
  priorityImage?: boolean;
  index?: number;
}

export function ShowcaseProjectCard({
  project,
  featured = false,
  dark = false,
  priorityImage = false,
  index = 0,
}: ShowcaseProjectCardProps) {
  const minPrice = Math.min(...project.units.map((u) => u.launchPriceAed));
  const isSoldOut = project.status === "sold-out";
  const badge = isSoldOut
    ? "Sold out"
    : project.paymentPlan || "Coming Soon";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "group overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-lg",
        featured ? "lg:col-span-2" : "",
        dark
          ? "border-white/10 bg-white/5"
          : "border-border bg-white",
      )}
    >
      <Link
        href={`/projects/${project.slug}`}
        className={cn("relative block", featured ? "h-64 md:h-72" : "h-48")}
      >
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.name}
            fill
            priority={priorityImage || featured}
            sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, 25vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className={cn("h-full bg-gradient-to-br", project.imageGradient)} />
        )}
        <div className="card-photo-overlay absolute inset-0" />
        <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-text-dark">
          {project.developer}
        </span>
      </Link>

      <div className={cn("space-y-3 p-5", dark ? "text-white" : "text-text-dark")}>
        <div>
          <p className={cn("text-xs font-medium uppercase", dark ? "text-white/70" : "text-muted")}>
            {project.developer}
          </p>
          <h3 className="text-lg font-semibold">
            <Link
              href={`/projects/${project.slug}`}
              className={dark ? "hover:text-brand-light" : "hover:text-brand"}
            >
              {project.name}
            </Link>
          </h3>
        </div>
        <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-brand")}>
          from {formatPrice(minPrice, "AED")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.slug}`}
            className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            View Details
          </Link>
          <FavoriteButton slug={project.slug} />
          {project.coordinates ? (
            <Link
              href={`/map?project=${project.slug}`}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                dark
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-border text-muted hover:border-brand hover:text-brand",
              )}
            >
              View on Map
            </Link>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}