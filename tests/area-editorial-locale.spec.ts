import { test, expect } from "./fixtures";
import { getAreaEditorial } from "../src/content/areas";

test.describe("area editorial locale (#375)", () => {
  test("EN JVC editorial is unchanged hand-crafted English", () => {
    const en = getAreaEditorial("jumeirah-village-circle", "en");
    expect(en).toBeTruthy();
    expect(en!.intro[0]).toContain("highest-volume mid-market district");
    expect(en!.intro.join(" ")).not.toContain("أعلى أحياء");
  });

  test("AR JVC editorial uses areas-ar overlay", () => {
    const ar = getAreaEditorial("jumeirah-village-circle", "ar");
    expect(ar).toBeTruthy();
    expect(ar!.intro[0]).toContain("أعلى أحياء دبي حجماً");
    expect(ar!.intro.join(" ")).not.toContain("highest-volume mid-market district");
    expect(ar!.faq?.[0]?.q).toMatch(/عوائد/);
  });

  test("AR without overlay falls back to EN body", () => {
    // palm-jebel-ali is hand-crafted EN with no areas-ar entry yet.
    const ar = getAreaEditorial("palm-jebel-ali", "ar");
    const en = getAreaEditorial("palm-jebel-ali", "en");
    expect(ar?.intro[0]).toBe(en?.intro[0]);
  });
});
