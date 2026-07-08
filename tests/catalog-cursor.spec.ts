import { test, expect } from "./fixtures";
import {
  catalogQueryKey,
  decodeCatalogCursor,
  encodeCatalogCursor,
} from "../src/lib/catalog-cursor";

test.describe("catalog cursor helpers", () => {
  test("encode/decode roundtrips offset and key", () => {
    const token = encodeCatalogCursor(48, "abc123");
    expect(decodeCatalogCursor(token)).toEqual({ offset: 48, key: "abc123" });
  });

  test("rejects malformed or empty tokens", () => {
    expect(decodeCatalogCursor(null)).toBeNull();
    expect(decodeCatalogCursor("")).toBeNull();
    expect(decodeCatalogCursor("not-base64!!")).toBeNull();
    expect(decodeCatalogCursor(encodeCatalogCursor(-1, "k"))).toBeNull();
  });

  test("query key changes when the query changes", () => {
    const a = catalogQueryKey({ sort: "featured", filters: { city: "dubai" } });
    const b = catalogQueryKey({ sort: "price-asc", filters: { city: "dubai" } });
    const aAgain = catalogQueryKey({ filters: { city: "dubai" }, sort: "featured" });
    expect(a).not.toBe(b);
    expect(a).toBe(aAgain);
  });
});

test.describe("catalog API cursor pagination", () => {
  test("walks pages via nextCursor without overlap", async ({ request }) => {
    const first = await request.get("/api/catalog/projects?pageSize=5");
    expect(first.status()).toBe(200);
    const firstBody = await first.json();

    expect(firstBody.meta.pageSize).toBe(5);
    expect(firstBody.meta.hasMore).toBe(true);
    expect(typeof firstBody.meta.nextCursor).toBe("string");
    expect(firstBody.meta.prevCursor).toBeNull();

    const second = await request.get(
      `/api/catalog/projects?pageSize=5&cursor=${encodeURIComponent(firstBody.meta.nextCursor)}`,
    );
    expect(second.status()).toBe(200);
    const secondBody = await second.json();

    expect(secondBody.meta.page).toBe(2);
    expect(secondBody.meta.prevCursor).not.toBeNull();

    const firstIds = firstBody.items.map((i: { unit: { id: string } }) => i.unit.id);
    const secondIds = secondBody.items.map((i: { unit: { id: string } }) => i.unit.id);
    expect(secondIds.some((id: string) => firstIds.includes(id))).toBe(false);
  });

  test("cursor matches the equivalent page offset", async ({ request }) => {
    const cursorRes = await request.get("/api/catalog/projects?pageSize=5");
    const cursorBody = await cursorRes.json();
    const nextViaCursor = await request.get(
      `/api/catalog/projects?pageSize=5&cursor=${encodeURIComponent(cursorBody.meta.nextCursor)}`,
    );
    const viaPage = await request.get("/api/catalog/projects?pageSize=5&page=2");

    const cursorIds = (await nextViaCursor.json()).items.map(
      (i: { unit: { id: string } }) => i.unit.id,
    );
    const pageIds = (await viaPage.json()).items.map(
      (i: { unit: { id: string } }) => i.unit.id,
    );
    expect(cursorIds).toEqual(pageIds);
  });

  test("ignores a cursor minted for a different query", async ({ request }) => {
    const res = await request.get("/api/catalog/projects?pageSize=5");
    const body = await res.json();
    // Reuse the cursor against a different sort — key mismatch → falls back to page 1.
    const mismatched = await request.get(
      `/api/catalog/projects?pageSize=5&sort=price-asc&cursor=${encodeURIComponent(body.meta.nextCursor)}`,
    );
    expect(mismatched.status()).toBe(200);
    expect((await mismatched.json()).meta.page).toBe(1);
  });
});
