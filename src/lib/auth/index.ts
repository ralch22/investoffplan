import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { magicLink } from "better-auth/plugins/magic-link";
import { getDb } from "@/lib/db/client";
import { accounts, rateLimits, sessions, users, verifications } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/site-url";

// Cloudflare Workers: D1 bindings are per-request (getCloudflareContext), so
// the better-auth instance must be constructed per request too — never cache
// it across requests in module scope.

const PROD_TRUSTED_ORIGINS = [
  "https://investoffplan.com",
  "https://www.investoffplan.com",
];

// Only trusted OUTSIDE production builds — the preview Worker and localhost
// must never be accepted origins for production auth flows.
const DEV_TRUSTED_ORIGINS = [
  "https://investoffplan-preview.emerge-digital.workers.dev",
  "http://localhost:3000",
  "http://localhost:8787",
];

/** Extract the target locale from a magic-link verify URL (callbackURL param). */
function localeFromMagicLinkUrl(url: string): "en" | "ar" {
  try {
    const callback = new URL(url).searchParams.get("callbackURL") ?? "";
    return callback === "/ar" || callback.startsWith("/ar/") ? "ar" : "en";
  } catch {
    return "en";
  }
}

async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  // Dynamic import: the real email module lands in feat/email-infra. The
  // placeholder in this branch reports "skipped"; either way a send failure
  // must never throw into better-auth's request handling.
  try {
    const [{ sendEmail }, { magicLinkEmail }] = await Promise.all([
      import("@/lib/email/resend"),
      import("@/lib/email/templates"),
    ]);
    const locale = localeFromMagicLinkUrl(url);
    const { subject, html } = magicLinkEmail({ url, locale });
    const result = await sendEmail({ to: email, subject, html, kind: "magic-link" });
    if (result.status !== "sent") {
      console.warn(`[auth] magic link email not sent (${result.status}) for ${email}`);
    }
  } catch (error) {
    console.warn("[auth] magic link email module unavailable — link not sent", error);
  }
}

/**
 * Per-request better-auth instance.
 *
 * Degrades instead of crashing when env/bindings are absent (build time,
 * preview without secrets): no Google provider without its env pair, magic
 * links log "skipped" without RESEND_API_KEY, and a memory adapter stands in
 * when the D1 binding is missing. Auth is effectively dormant until
 * BETTER_AUTH_SECRET (+ provider secrets) are configured.
 */
export async function getAuth() {
  const db = await getDb();

  const trustedOrigins =
    process.env.NODE_ENV !== "production"
      ? [...PROD_TRUSTED_ORIGINS, ...DEV_TRUSTED_ORIGINS]
      : PROD_TRUSTED_ORIGINS;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    console.warn("[auth] BETTER_AUTH_SECRET is not set — auth is running in dormant mode");
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleEnabled = Boolean(googleClientId && googleClientSecret);

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? getSiteUrl(),
    // Fallback keeps the worker alive pre-secrets; real deployments MUST set
    // BETTER_AUTH_SECRET (docs/auth-setup.md) before enabling sign-in.
    secret: secret ?? "iop-dormant-placeholder-secret-set-BETTER_AUTH_SECRET",
    database: db
      ? drizzleAdapter(db, {
          provider: "sqlite",
          schema: {
            user: users,
            session: sessions,
            account: accounts,
            verification: verifications,
            rateLimit: rateLimits,
          },
        })
      : memoryAdapter({}),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 300,
      },
    },
    // Durable, D1-backed throttle (memory storage is per-isolate on Workers —
    // nearly useless). Tightest caps on the endpoints that send real email.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      storage: db ? ("database" as const) : ("memory" as const),
      customRules: {
        "/sign-in/magic-link": { window: 60, max: 5 },
        "/magic-link/verify": { window: 60, max: 10 },
      },
    },
    user: {
      additionalFields: {
        locale: {
          type: "string",
          required: false,
          defaultValue: "en",
          input: false,
        },
      },
    },
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
          },
        }
      : {},
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
    trustedOrigins,
  });
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
