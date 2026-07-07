import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(context);
  },
});

export { expect };