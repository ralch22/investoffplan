# GHL "New IOP Lead → WhatsApp notify" workflow (manual setup, ~5 min)

Every site lead is upserted into the **Invest Off Plan** location (`Xh73WHvCqidcrgTGCzBC`)
with tags `investoffplan` + `iop-<formType>` (contact, contact-cta, brochure,
newsletter, mortgage-preapproval) and `source: investoffplan.com`. The worker can
additionally enrol each new contact into ONE workflow when the `GHL_WORKFLOW_ID`
secret is set (`src/lib/ghl.ts` calls `POST /contacts/{id}/workflow/{workflowId}`).

## Prerequisite (dashboard-only)
WhatsApp sending requires a connected WhatsApp channel in the location
(Settings → WhatsApp — GHL's Meta/WABA flow, ~USD 10/mo per number). Until that
exists, use the Internal Notification / SMS actions instead.

## Steps (in the Invest Off Plan location)
1. **Automation → Workflows → Create Workflow → Start from scratch.**
   Name: `IOP — New lead notify`.
2. **Trigger:** `Contact Tag` → Tag Added → `investoffplan`.
   (Covers every form type; alternatively use trigger "Contact Created" with a
   tag filter.)
3. **Action 1 — notify Jad:** once WhatsApp channel is live: `WhatsApp → Send
   Message` is only for the *contact*; to notify the **team** numbers
   (+971 58 527 6222, +971 52 589 3197) use `Internal Notification` (app push /
   email to assigned users) — add both users to the location and assign — or a
   `Webhook` action posting to any notifier. Include merge fields:
   `{{contact.name}} / {{contact.phone}} / {{contact.email}} /
   {{contact.last_note}}` (the site writes the inquiry into the custom field
   `iop_last_inquiry`).
4. **Action 2 (optional) — greet the lead on WhatsApp** (needs WABA + an
   approved template): `Send WhatsApp Template` → welcome template.
5. **Publish**, copy the workflow ID from the URL
   (`.../workflow/<WORKFLOW_ID>`), then have Claude set it:
   `printf "<id>" | npx wrangler secret put GHL_WORKFLOW_ID` (both worker
   configs). From then on every lead is auto-enrolled.

## Notes
- The private-integration token can read workflows (`GET /workflows/?locationId=…`)
  so Claude can verify the ID after you create it.
- The internal (token-grabber) API path was verified viable on 2026-07-08 for
  future CLI-built workflows, but manual creation is safer for this first one.
