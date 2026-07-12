import { NEWS_ARTICLES_CONTENT } from "./news";
import { GUIDE_BODIES } from "./guide-bodies";
import type { Article, ArticleSection } from "./types";
import type { Locale } from "@/i18n/config";

export type { Article, ArticleFaq, ArticleSection } from "./types";

/** News articles, newest first. */
export function getNewsArticles(): Article[] {
  return [...NEWS_ARTICLES_CONTENT].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getNewsArticle(slug: string): Article | undefined {
  return NEWS_ARTICLES_CONTENT.find((article) => article.slug === slug);
}

/** Prefer AR title/description when present (#298); EN body sections stay EN for v1. */
export function articleTitle(article: Article, locale: Locale): string {
  return locale === "ar" && article.titleAr ? article.titleAr : article.title;
}

export function articleDescription(article: Article, locale: Locale): string {
  return locale === "ar" && article.descriptionAr
    ? article.descriptionAr
    : article.description;
}

/** Rich section bodies for guide slugs that have been expanded. */
export function getGuideBody(slug: string): ArticleSection[] | undefined {
  return GUIDE_BODIES[slug];
}
