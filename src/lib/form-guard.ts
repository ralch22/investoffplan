import { isTurnstileEnabled } from "@/lib/turnstile";

export function isHoneypotTripped(value: string): boolean {
  return value.trim().length > 0;
}

export async function verifyTurnstileClient(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isTurnstileEnabled()) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: "Please complete the security check." };
  }

  try {
    const res = await fetch("/api/turnstile/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: "Security verification failed. Please try again.",
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return {
        ok: false,
        error: "Security verification failed. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to verify submission. Please try again." };
  }
}

export async function guardFormSubmit(opts: {
  honeypot: string;
  turnstileToken: string;
}): Promise<{ ok: boolean; bot?: boolean; error?: string }> {
  if (isHoneypotTripped(opts.honeypot)) {
    return { ok: false, bot: true };
  }

  const verify = await verifyTurnstileClient(opts.turnstileToken);
  if (!verify.ok) {
    return { ok: false, error: verify.error };
  }

  return { ok: true };
}