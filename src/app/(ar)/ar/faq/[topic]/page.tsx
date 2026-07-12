import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getFaqTopic } from "@/content/faq";
import { getDictionary } from "@/i18n";
import FaqTopicPage, { generateStaticParams } from "@/app/(en)/faq/[topic]/page";

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

  const dict = getDictionary("ar");
  const topicCopy = dict.faq.topics as Record<
    string,
    { title: string; description: string }
  >;
  const copy = topicCopy[topic];
  const title = copy?.title ?? faqTopic.title;
  const description = copy?.description ?? faqTopic.description;

  return arMeta({
    path: `/faq/${topic}`,
    title: `${title} — أسئلة شائعة`,
    description,
  });
}

export default async function ArFaqTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  return <FaqTopicPage params={params} locale="ar" />;
}
