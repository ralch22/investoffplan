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

export function testEmail(): EmailTemplate {
  const subject = "Test email — invest off-plan";
  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;color:${TEXT_DARK};">Email delivery is working</h1>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_DARK};">This is a test message from the invest off-plan email infrastructure. If you're reading this, Resend sending is configured correctly.</p>`;
  const footer = "Sent by the invest off-plan platform — no action needed.";
  return { subject, html: layout({ locale: "en", title: subject, bodyHtml, footer }) };
}
