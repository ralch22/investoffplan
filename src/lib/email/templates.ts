/**
 * Pure email template builders — brand-simple inline-styled HTML that renders
 * in Gmail (600px table layout, brand red accent). EN + AR variants; AR uses
 * dir="rtl". No react-email dependency by design: templates are plain strings.
 */

const BRAND_RED = "#e60000";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#6b7280";
const BG = "#f4f4f5";

export interface EmailTemplate {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface LayoutInput {
  locale: "en" | "ar";
  title: string;
  bodyHtml: string;
  footer: string;
}

function layout({ locale, title, bodyHtml, footer }: LayoutInput): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const brand = locale === "ar" ? "إنفست أوف بلان" : "invest off-plan";
  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background-color:${BRAND_RED};padding:20px 32px;" align="${align}">
<span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">${brand}</span>
</td></tr>
<tr><td style="padding:32px;" align="${align}" dir="${dir}">
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;" align="${align}" dir="${dir}">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${TEXT_MUTED};">${footer}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface MagicLinkEmailInput {
  url: string;
  locale?: "en" | "ar";
}

export function magicLinkEmail({ url, locale = "en" }: MagicLinkEmailInput): EmailTemplate {
  const safeUrl = escapeHtml(url);

  if (locale === "ar") {
    const subject = "رابط تسجيل الدخول الخاص بك — إنفست أوف بلان";
    const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">تسجيل الدخول إلى حسابك</h1>
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">اضغط على الزر أدناه لتسجيل الدخول. هذا الرابط صالح لفترة محدودة ويمكن استخدامه مرة واحدة فقط.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:${BRAND_RED};border-radius:6px;">
<a href="${safeUrl}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">تسجيل الدخول</a>
</td></tr></table>
<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${TEXT_MUTED};">إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:<br><a href="${safeUrl}" style="color:${BRAND_RED};word-break:break-all;">${safeUrl}</a></p>`;
    const footer =
      "إذا لم تطلب هذا الرابط، يمكنك تجاهل هذه الرسالة بأمان. — إنفست أوف بلان، دبي";
    return { subject, html: layout({ locale, title: subject, bodyHtml, footer }) };
  }

  const subject = "Your sign-in link — invest off-plan";
  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">Sign in to your account</h1>
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">Click the button below to sign in. This link is valid for a limited time and can only be used once.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:${BRAND_RED};border-radius:6px;">
<a href="${safeUrl}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Sign in</a>
</td></tr></table>
<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${TEXT_MUTED};">If the button doesn't work, copy and paste this link into your browser:<br><a href="${safeUrl}" style="color:${BRAND_RED};word-break:break-all;">${safeUrl}</a></p>`;
  const footer =
    "If you didn't request this link, you can safely ignore this email. — invest off-plan, Dubai";
  return { subject, html: layout({ locale, title: subject, bodyHtml, footer }) };
}

export interface AlertDigestMatch {
  name: string;
  community: string;
  /** Formatted from-price, e.g. "AED 1.2M" — pre-formatted by the caller. */
  fromPrice?: string;
  /** Absolute URL (with UTM params) to the project page. */
  url: string;
}

export interface AlertDigestSearch {
  label: string;
  /** Absolute URL to the SERP with the saved filters applied. */
  searchUrl: string;
  /** Absolute no-login unsubscribe URL for this saved search. */
  unsubscribeUrl: string;
  matches: AlertDigestMatch[];
}

export interface AlertDigestEmailInput {
  searches: AlertDigestSearch[];
  locale?: "en" | "ar";
}

/**
 * ONE digest per user per dispatch run: a section per saved search that had
 * new launches this week, each row linking to the project page. Every section
 * carries its own unsubscribe link (token-guarded, no login).
 */
export function alertDigestEmail({
  searches,
  locale = "en",
}: AlertDigestEmailInput): EmailTemplate {
  const ar = locale === "ar";
  const totalMatches = searches.reduce((sum, s) => sum + s.matches.length, 0);

  const t = ar
    ? {
        subject: `${totalMatches} مشاريع جديدة تطابق عمليات البحث المحفوظة — إنفست أوف بلان`,
        heading: "إطلاقات جديدة هذا الأسبوع",
        intro: "مشاريع على المخطط أُطلقت حديثاً وتطابق عمليات البحث المحفوظة لديك:",
        from: "ابتداءً من",
        viewAll: "عرض كل النتائج",
        unsubscribe: "إلغاء الاشتراك في تنبيهات هذا البحث",
        footer:
          "تصلك هذه الرسالة لأنك فعّلت تنبيهات البحث المحفوظ. — إنفست أوف بلان، دبي",
      }
    : {
        subject: `${totalMatches} new launch${totalMatches === 1 ? "" : "es"} matching your saved searches — invest off-plan`,
        heading: "New launches this week",
        intro: "Newly launched off-plan projects matching your saved searches:",
        from: "From",
        viewAll: "View all results",
        unsubscribe: "Unsubscribe from alerts for this search",
        footer:
          "You're receiving this because you enabled saved-search alerts. — invest off-plan, Dubai",
      };

  const sections = searches
    .map((search) => {
      const rows = search.matches
        .map(
          (m) => `
<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
<a href="${escapeHtml(m.url)}" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${TEXT_DARK};text-decoration:none;">${escapeHtml(m.name)}</a>
<p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:${TEXT_MUTED};">${escapeHtml(m.community)}${m.fromPrice ? ` · ${t.from} ${escapeHtml(m.fromPrice)}` : ""}</p>
</td></tr>`,
        )
        .join("");
      return `
<h2 style="margin:24px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:${BRAND_RED};">${escapeHtml(search.label)}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;">
<a href="${escapeHtml(search.searchUrl)}" style="color:${BRAND_RED};font-weight:bold;text-decoration:none;">${t.viewAll} →</a>
&nbsp;·&nbsp;
<a href="${escapeHtml(search.unsubscribeUrl)}" style="color:${TEXT_MUTED};">${t.unsubscribe}</a>
</p>`;
    })
    .join("");

  const bodyHtml = `
<h1 style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">${t.heading}</h1>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">${t.intro}</p>
${sections}`;

  return {
    subject: t.subject,
    html: layout({ locale, title: t.subject, bodyHtml, footer: t.footer }),
  };
}

export interface LeadNotificationEmailInput {
  /** Human label for the source, e.g. "Floor-plan unlock". */
  sourceLabel: string;
  name?: string;
  email?: string;
  phone?: string;
  projectSlug?: string;
  pagePath?: string;
  message?: string;
  /** Absolute site origin for building the project link. */
  siteUrl: string;
}

/**
 * Internal owner alert — one per accepted lead, sent to the monitored team
 * mailbox. EN only (internal). The reply-to is set to the lead's email by the
 * caller so a reply reaches the prospect directly.
 */
export function leadNotificationEmail(input: LeadNotificationEmailInput): EmailTemplate {
  const who = input.name?.trim() || input.email || input.phone || "Someone";
  const subject = input.projectSlug
    ? `New lead · ${input.sourceLabel} · ${input.projectSlug}`
    : `New lead · ${input.sourceLabel}`;

  const rows: Array<[string, string | undefined]> = [
    ["Source", input.sourceLabel],
    ["Name", input.name],
    ["Phone", input.phone],
    ["Email", input.email],
    ["Project", input.projectSlug],
    ["Message", input.message],
    ["Page", input.pagePath],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `
<tr>
<td style="padding:6px 12px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_MUTED};vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td>
<td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT_DARK};">${escapeHtml(v as string)}</td>
</tr>`,
    )
    .join("");

  // A phone-bearing lead is actionable immediately — surface a wa.me deep link.
  const waDigits = input.phone ? input.phone.replace(/[^\d]/g, "") : "";
  const waBlock = waDigits
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background-color:${BRAND_RED};border-radius:6px;">
<a href="https://wa.me/${waDigits}" style="display:inline-block;padding:11px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Message on WhatsApp</a>
</td></tr></table>`
    : "";

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;color:${TEXT_DARK};">New lead: ${escapeHtml(who)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${table}</table>
${waBlock}`;
  const footer = "Automated alert from investoffplan.com — reply to this email to reach the lead.";
  return { subject, html: layout({ locale: "en", title: subject, bodyHtml, footer }) };
}

export interface LeadAckEmailInput {
  name?: string;
  /** Human-readable project name if known, else undefined. */
  projectName?: string;
  locale?: "en" | "ar";
}

/**
 * Auto-acknowledgement to the lead (only when they gave an email). Sets the
 * expectation that a specialist will follow up. Bilingual; reply-to is the
 * monitored team mailbox so a reply lands with the team.
 */
export function leadAckEmail({ name, projectName, locale = "en" }: LeadAckEmailInput): EmailTemplate {
  const ar = locale === "ar";
  const first = (name?.trim().split(/\s+/)[0]) || (ar ? "مرحباً" : "there");
  const about = projectName ? escapeHtml(projectName) : ar ? "استثمارك في دبي" : "your Dubai investment";

  if (ar) {
    const subject = "استلمنا طلبك — إنفست أوف بلان";
    const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">شكراً لك، ${escapeHtml(first)}</h1>
<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">استلمنا طلبك بخصوص ${about}. سيتواصل معك أحد مستشاري الاستثمار قريباً — عادةً خلال ساعات العمل نفسها.</p>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">في هذه الأثناء، يمكنك استكشاف أحدث المشاريع على المخطط على موقعنا.</p>`;
    const footer = "تصلك هذه الرسالة لأنك تواصلت معنا عبر investoffplan.com — إنفست أوف بلان، دبي";
    return { subject, html: layout({ locale, title: subject, bodyHtml, footer }) };
  }

  const subject = "We've received your enquiry — invest off-plan";
  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">Thanks, ${escapeHtml(first)}</h1>
<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">We've received your enquiry about ${about}. One of our investment specialists will be in touch shortly — usually within the same business hours.</p>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">In the meantime, feel free to keep exploring the latest off-plan launches on our site.</p>`;
  const footer = "You're receiving this because you contacted us via investoffplan.com — invest off-plan, Dubai";
  return { subject, html: layout({ locale, title: subject, bodyHtml, footer }) };
}

export function testEmail(): EmailTemplate {
  const subject = "Test email — invest off-plan";
  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">Email delivery is working</h1>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">This is a test message from the invest off-plan email infrastructure. If you're reading this, Resend sending is configured correctly.</p>`;
  const footer = "Sent by the invest off-plan platform — no action needed.";
  return { subject, html: layout({ locale: "en", title: subject, bodyHtml, footer }) };
}
