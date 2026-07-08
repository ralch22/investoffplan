"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";

/** next/link that prefixes internal hrefs with /ar when rendered in the AR tree. */
export function LocalizedLink({
  href,
  ...rest
}: ComponentProps<typeof Link> & { href: string }) {
  const { locale } = useI18n();
  return <Link href={localePath(locale, href)} {...rest} />;
}
