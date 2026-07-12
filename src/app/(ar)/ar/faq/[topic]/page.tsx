import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getFaqTopic } from "@/content/faq";
import FaqTopicPage, { generateStaticParams } from "@/app/(en)/faq/[topic]/page";

export { generateStaticParams };

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const faqTopic = getFaqTopic(topic);
  if (!faqTopic) return arMeta({ path: `/faq/${topic}` });
  return {
    ...arMeta({ path: `/faq/${topic}` }),
    title: `${faqTopic.title} — أسئلة شائعة`,
    description: faqTopic.description,
  };
}

export default async function ArFaqTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  return <FaqTopicPage params={params} locale="ar" />;
}
