import { test, expect } from "./fixtures";
import { getDictionary } from "../src/i18n";
import {
  localeFromPathname,
  localePath,
  pathIsArabic,
} from "../src/i18n/config";

/**
 * #297 — root error.tsx locale chrome (dict + path helpers).
 * Error boundaries are hard to drive in browser e2e; lock the pure path
 * resolution and EN/AR copy that error.tsx renders. Prefer CI full e2e for
 * suite regression.
 */
test.describe("error page i18n (#297)", () => {
  test("pathIsArabic / localeFromPathname cover AR tree edges", () => {
    expect(pathIsArabic("/ar")).toBe(true);
    expect(pathIsArabic("/ar/projects")).toBe(true);
    expect(pathIsArabic("/ar/projects?x=1")).toBe(true);
    expect(pathIsArabic("https://investoffplan.com/ar/about")).toBe(true);
    expect(pathIsArabic("/projects")).toBe(false);
    expect(pathIsArabic("/")).toBe(false);
    expect(pathIsArabic(null)).toBe(false);

    expect(localeFromPathname("/ar/contact")).toBe("ar");
    expect(localeFromPathname("/contact")).toBe("en");
  });

  test("EN errorPage copy matches previous hard-coded chrome", () => {
    const t = getDictionary("en").errorPage;
    expect(t.label).toBe("Error");
    expect(t.title).toBe("Something went wrong");
    expect(t.body).toBe(
      "An unexpected error occurred. Please try again or return to the homepage.",
    );
    expect(t.tryAgain).toBe("Try again");
    expect(t.goHome).toBe("Go home");
  });

  test("AR errorPage has non-empty Arabic chrome (not English)", () => {
    const t = getDictionary("ar").errorPage;
    expect(t.label).toMatch(/[\u0600-\u06FF]/);
    expect(t.title).toMatch(/[\u0600-\u06FF]/);
    expect(t.body).toMatch(/[\u0600-\u06FF]/);
    expect(t.tryAgain).toMatch(/[\u0600-\u06FF]/);
    expect(t.goHome).toMatch(/[\u0600-\u06FF]/);
    expect(t.title).not.toBe("Something went wrong");
    expect(t.goHome).not.toBe("Go home");
  });

  test("home CTA target is locale-prefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("ar", "/")).toBe("/ar");
  });
});
