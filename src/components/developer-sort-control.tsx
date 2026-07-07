"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SortSelect } from "@/components/sort-select";
import type { SortOption } from "@/lib/types";

interface DeveloperSortControlProps {
  value: SortOption;
}

export function DeveloperSortControl({ value }: DeveloperSortControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(nextSort: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === "featured") params.delete("sort");
    else params.set("sort", nextSort);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  return <SortSelect value={value} onChange={onChange} />;
}