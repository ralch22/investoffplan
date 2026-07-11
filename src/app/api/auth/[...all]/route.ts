import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// better-auth needs a per-request instance (D1 binding comes from the request
// context), so we can't use toNextJsHandler's static form — resolve inside.
async function handle(request: Request): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as PUT,
  handle as DELETE,
};
