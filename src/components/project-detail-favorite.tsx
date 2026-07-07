"use client";

import { FavoriteButton } from "@/components/favorite-button";

interface ProjectDetailFavoriteProps {
  slug: string;
}

export function ProjectDetailFavorite({ slug }: ProjectDetailFavoriteProps) {
  return <FavoriteButton slug={slug} className="h-11 w-11 shrink-0" />;
}