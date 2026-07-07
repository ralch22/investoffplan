import { NextResponse } from "next/server";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTurnstileEnabled()) {
    return NextResponse.json({ success: true, skipped: true });
  }

  let token = "";
  try {
    const json = (await request.json()) as { token?: string };
    token = json.token?.trim() ?? "";
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
  }

  const forwarded = request.headers.get("cf-connecting-ip");
  const result = await verifyTurnstileToken(token, forwarded ?? undefined);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: "Verification failed", codes: result["error-codes"] },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}