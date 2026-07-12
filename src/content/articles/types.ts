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
  /** Optional Arabic title for `/ar/news/*` H1 + metadata (#298). */
  titleAr?: string;
  /** Optional Arabic meta/description for `/ar/news/*` hero (#298). */
  descriptionAr?: string;
  category: "news" | "guide";
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  sections: ArticleSection[];
  faq?: ArticleFaq[];
}
