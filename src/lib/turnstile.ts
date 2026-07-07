export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function getTurnstileSiteKey(): string | undefined {
  return TURNSTILE_SITE_KEY || undefined;
}

export function isTurnstileEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}

export interface TurnstileVerifyResult {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: true };
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return { success: false, "error-codes": ["internal-error"] };
  }

  return (await res.json()) as TurnstileVerifyResult;
}