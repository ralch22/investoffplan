export const runtime = "edge";

export function GET() {
  return new Response("investoffplan-indexnow-2026", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
