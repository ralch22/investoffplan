import { test, expect } from "./fixtures";
import {
  sanitizeProjectHtml,
  sanitizePfFaqs,
  htmlToPlainText,
} from "../src/lib/sanitize-html";

test.describe("sanitizeProjectHtml", () => {
  test("strips empty elements left after tag filtering", () => {
    const out = sanitizeProjectHtml(
      "<h3></h3><p> </p><p>&nbsp;</p><span></span><p>Keep me</p>",
    );
    expect(out).toBe("<p>Keep me</p>");
  });

  test("strips paragraphs that only hold a line break", () => {
    expect(sanitizeProjectHtml("<p><br></p><p>Real</p>")).toBe("<p>Real</p>");
  });

  test("demotes scraped h2 to h3", () => {
    const out = sanitizeProjectHtml("<h2>Overview</h2><p>Body</p>");
    expect(out).toBe("<h3>Overview</h3><p>Body</p>");
    expect(out).not.toContain("<h2>");
  });

  test("normalises cosmetic entities but keeps markup encoded", () => {
    const out = sanitizeProjectHtml("<p>A&nbsp;B&mdash;C &amp; &lt;tag&gt;</p>");
    expect(out).toBe("<p>A B—C &amp; &lt;tag&gt;</p>");
  });

  test("collapses runs of <br> to a single break", () => {
    expect(sanitizeProjectHtml("<p>a<br><br><br>b</p>")).toBe("<p>a<br>b</p>");
  });

  test("drops disallowed tags and their attributes", () => {
    const out = sanitizeProjectHtml(
      '<p style="color:red" onclick="x()">Hi</p><img src=x><script>bad()</script>',
    );
    expect(out).toBe("<p>Hi</p>");
  });

  test("keeps encoded markup encoded (no XSS resurfacing)", () => {
    const out = sanitizeProjectHtml("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    expect(out).not.toContain("<script>");
  });
});

test.describe("htmlToPlainText", () => {
  test("decodes entities and flattens tags", () => {
    expect(htmlToPlainText("<p>A&nbsp;&amp;&nbsp;B</p>")).toBe("A & B");
  });
});

test.describe("sanitizePfFaqs", () => {
  test("strips tags and entities to plain text", () => {
    const [faq] = sanitizePfFaqs([
      { q: "<b>Who&nbsp;builds it?</b>", a: "<p>Emaar &amp; partners.</p>" },
    ]);
    expect(faq.q).toBe("Who builds it?");
    expect(faq.a).toBe("Emaar & partners.");
  });

  test("drops property-finder attribution sentences", () => {
    const [faq] = sanitizePfFaqs([
      {
        q: "Who is the owner?",
        a: "<p>Developed by Emaar Properties.</p><p>PROPERTY FINDER</p>",
      },
    ]);
    expect(faq.a).toBe("Developed by Emaar Properties.");
    expect(faq.a).not.toMatch(/property\s*finder/i);
  });

  test("caps question at 200 and answer at 600 chars", () => {
    const [faq] = sanitizePfFaqs([
      { q: "Q ".repeat(200), a: "word ".repeat(300) },
    ]);
    expect(faq.q.length).toBeLessThanOrEqual(200);
    expect(faq.a.length).toBeLessThanOrEqual(600);
  });

  test("drops entries left empty after sanitisation", () => {
    expect(
      sanitizePfFaqs([{ q: "<p></p>", a: "PROPERTY FINDER" }]),
    ).toHaveLength(0);
  });
});

test.describe("messy PDP renders clean", () => {
  test("Lillia Townhouses PDP shows no PROPERTY FINDER attribution", async ({
    page,
  }) => {
    const response = await page.goto("/projects/lillia-townhouses");
    expect(response?.status()).toBeLessThan(400);
    const faq = page.locator("#project-faq");
    await expect(faq).toBeVisible();
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("property finder");
    expect(body).not.toContain("<p>");
  });
});
