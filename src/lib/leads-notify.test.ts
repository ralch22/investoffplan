/**
 * Pins the source-agnostic lead-notification policy: every formType gets a
 * label (known or derived), acknowledgements go only to high-intent
 * email-bearing sources, and slug→name is a faithful reformat.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  leadSourceLabel,
  projectNameFromSlug,
  shouldAckLead,
} from "./leads-notify";

test("known form types get their tailored label", () => {
  assert.equal(leadSourceLabel("floorplans"), "Floor-plan unlock");
  assert.equal(leadSourceLabel("brochure"), "Brochure request");
  assert.equal(leadSourceLabel("mortgage-preapproval"), "Mortgage pre-approval");
});

test("unknown form types never go unlabelled — they title-case the raw type", () => {
  assert.equal(leadSourceLabel("virtual_tour"), "Virtual Tour");
  assert.equal(leadSourceLabel("price-drop"), "Price Drop");
});

test("only high-intent, email-bearing leads are acknowledged", () => {
  assert.equal(shouldAckLead("floorplans", true), true);
  assert.equal(shouldAckLead("contact", true), true);
  // Same source without an email address → no ack (phone-only floor-plan lead).
  assert.equal(shouldAckLead("floorplans", false), false);
  // Excluded sources never ack, even with an email.
  assert.equal(shouldAckLead("newsletter", true), false);
  assert.equal(shouldAckLead("advisor", true), false);
  // Unknown source defaults to no-ack.
  assert.equal(shouldAckLead("mystery", true), false);
});

test("slug → readable project name is a faithful reformat, not a fabrication", () => {
  assert.equal(projectNameFromSlug("al-haseen-residence-6"), "Al Haseen Residence 6");
  assert.equal(projectNameFromSlug(undefined), undefined);
});
