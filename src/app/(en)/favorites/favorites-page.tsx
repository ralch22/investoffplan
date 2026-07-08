"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import { FAVORITES_CHANGED_EVENT, getFavoriteSlugs } from "@/lib/favorites";
import type { Project } from "@/lib/types";

export function FavoritesPage() {
  const [slugs, setSlugs] = useState<string[]>(getFavoriteSlugs);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(slugs.length > 0);

  const loadProjects = useCallback(async (nextSlugs: string[]) => {
    if (nextSlugs.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects/by-slugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: nextSlugs }),
      });
      if (!res.ok) throw new Error("Failed to load favorites");
      const data = (await res.json()) as { projects: Project[] };
      const order = new Map(nextSlugs.map((slug, i) => [slug, i]));
      const sorted = [...data.projects].sort(
        (a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99),
      );
      setProjects(sorted);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects(slugs);
  }, [slugs, loadProjects]);

  useEffect(() => {
    const sync = () => setSlugs(getFavoriteSlugs());
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
  }, []);

  return (
    <PageShell headerVariant="transparent">
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">
            My <em className="italic">Favorites.</em>
          </h1>
          <p className="mt-3 text-white/85">Your saved off-plan properties</p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Favorites" },
          ]}
        />
        {loading ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface-alt p-12 text-center text-sm text-muted">
            Loading saved projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-alt p-12 text-center">
            <p className="text-lg font-medium text-text-dark">No favorites yet</p>
            <p className="mt-2 text-sm text-muted">
              Tap the star on any project card to save it here.
            </p>
            <PrimaryButton href="/projects" className="mt-6">
              Browse Projects
            </PrimaryButton>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {projects.map((project) => (
              <ShowcaseProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {projects.length > 0 ? (
          <div className="mt-10 text-center">
            <Link
              href="/projects"
              className="rounded-full border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
            >
              Browse more projects
            </Link>
          </div>
        ) : null}
      </main>
    </PageShell>
  );
}