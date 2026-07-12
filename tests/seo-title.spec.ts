import { test, expect } from "./fixtures";
import {
  SEO_TITLE_BRAND_LEN,
  SEO_TITLE_MAX,
  clampSeoTitle,
  comparePairTitle,
} from "../src/lib/seo-title";

test.describe("seo-title helpers", () => {
  test("clampSeoTitle preserves short titles and hard-caps long ones", () => {
    expect(clampSeoTitle("Short title")).toBe("Short title");
    const long = "A".repeat(80);
    expect(clampSeoTitle(long).length).toBeLessThanOrEqual(SEO_TITLE_MAX);
  });

  test("comparePairTitle leaves room for layout brand suffix", () => {
    const title = comparePairTitle(
      "Damac Properties",
      "Emaar Properties",
      "developers",
    );
    expect(title.length + SEO_TITLE_BRAND_LEN).toBeLessThanOrEqual(SEO_TITLE_MAX);
    expect(title).toMatch(/vs/);
    expect(title).not.toMatch(/\| invest off-plan/);
  });

  test("drops kind bit when names alone fill the budget", () => {
    const title = comparePairTitle(
      "Very Long Developer Name One Residences",
      "Another Extremely Long Developer Brand",
      "developers",
    );
    expect(title.length).toBeLessThanOrEqual(SEO_TITLE_MAX - SEO_TITLE_BRAND_LEN);
    expect(title).not.toMatch(/developers/);
  });
});
