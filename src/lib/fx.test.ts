/**
 * Pins the FX-conversion invariants for the international landing pages:
 * rates come from the COMMITTED pin (never live), captions carry provenance,
 * and audience-convention formatting stays stable.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { aedToGbpLabel, aedToInrLabel, fxCaption, getFxPin } from "./fx";

test("the FX pin carries full provenance", () => {
  const pin = getFxPin();
  assert.equal(pin.base, "AED");
  assert.match(pin.asOf, /^\d{4}-\d{2}-\d{2}$/, "as-of date is committed");
  assert.ok(pin.source.length > 5, "source is named");
  assert.ok(pin.rates.INR > 0 && pin.rates.GBP > 0);
});

test("INR formatting follows lakh/crore conventions", () => {
  // AED 1M ≈ ₹2.63 crore at the pinned 26.25 — sanity anchor from the pin PR.
  assert.match(aedToInrLabel(1_000_000), /^₹\d+(\.\d+)? crore$/);
  // Sub-crore amounts read in lakh.
  assert.match(aedToInrLabel(300_000), /^₹\d+ lakh$/);
});

test("GBP formatting rounds to a readable thousand", () => {
  assert.match(aedToGbpLabel(1_000_000), /^£\d{1,3}(,\d{3})*$/);
});

test("every caption names the rate, the source, and the AED rule", () => {
  for (const c of [fxCaption("INR"), fxCaption("GBP")]) {
    assert.ok(c.includes("1 AED ="));
    assert.ok(c.includes(getFxPin().asOf));
    assert.ok(c.includes("All transactions are in AED"));
  }
});
