import { NEWS_ARTICLES_CONTENT } from "./news";
import { GUIDE_BODIES } from "./guide-bodies";
import type { Article, ArticleSection } from "./types";

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

/** Rich section bodies for guide slugs that have been expanded. */
export function getGuideBody(slug: string): ArticleSection[] | undefined {
  return GUIDE_BODIES[slug];
}
