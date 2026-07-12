import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getFaqTopic } from "@/content/faq";
import { getDictionary } from "@/i18n";
import FaqTopicPage, {
  generateStaticParams,
  topicChrome,
} from "@/app/(en)/faq/[topic]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const faqTopic = getFaqTopic(topic);
  if (!faqTopic) return arMeta({ path: `/faq/${topic}` });
  const chrome = topicChrome("ar", topic);
  const dict = getDictionary("ar");
  const title = `${chrome?.title ?? faqTopic.title} — ${dict.faq.topicTitleSuffix}`;
  return arMeta({
    path: `/faq/${topic}`,
    title,
    description: chrome?.description ?? faqTopic.description,
  });
}

export default async function ArFaqTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  return <FaqTopicPage params={params} locale="ar" />;
}
