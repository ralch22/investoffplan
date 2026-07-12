import { test, expect } from "@playwright/test";
import { reversePairSlug, withReversePairSlugs } from "../src/lib/pair-slug";

test.describe("pair-slug helpers", () => {
  test("reversePairSlug swaps sides", () => {
    expect(reversePairSlug("dubai-marina-vs-jumeirah-village-circle")).toBe(
      "jumeirah-village-circle-vs-dubai-marina",
    );
    expect(reversePairSlug("a-vs-b")).toBe("b-vs-a");
    expect(reversePairSlug("no-separator")).toBeNull();
    expect(reversePairSlug("a-vs-")).toBeNull();
    expect(reversePairSlug("-vs-b")).toBeNull();
    expect(reversePairSlug("same-vs-same")).toBeNull();
  });

  test("withReversePairSlugs includes both orders once", () => {
    const out = withReversePairSlugs(["a-vs-b", "c-vs-d"]);
    expect(out.sort()).toEqual(["a-vs-b", "b-vs-a", "c-vs-d", "d-vs-c"].sort());
    // Idempotent on already-reversed input set.
    expect(withReversePairSlugs(out).sort()).toEqual(out.sort());
  });
});
