export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface Article {
  slug: string;
  title: string;
  /** SEO meta description (<=160 chars). */
  description: string;
  category: "news" | "guide";
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  sections: ArticleSection[];
  faq?: ArticleFaq[];
}
