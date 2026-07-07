"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface ProjectGalleryProps {
  images: string[];
  alt: string;
  fallbackClassName?: string;
}

export function ProjectGallery({
  images,
  alt,
  fallbackClassName,
}: ProjectGalleryProps) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (!gallery.length) {
    return (
      <div
        className={cn(
          "relative mb-6 mt-4 h-64 overflow-hidden rounded-2xl",
          fallbackClassName,
        )}
      />
    );
  }

  return (
    <div className="mb-6 mt-4 space-y-3">
      <div className="relative h-64 overflow-hidden rounded-2xl md:h-80">
        <Image
          src={gallery[active]!}
          alt={alt}
          fill
          className="object-cover"
          priority={active === 0}
          fetchPriority={active === 0 ? "high" : "auto"}
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.slice(0, 8).map((src, i) => (
            <button
              key={`${i}-${src}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2",
                i === active ? "ring-brand" : "ring-transparent",
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}