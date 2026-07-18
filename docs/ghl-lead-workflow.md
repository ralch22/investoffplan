# GHL lead intake workflow (one-time UI build)

The website lead path is automated end-to-end **in code** already:

| Stage | Where | Status |
|---|---|---|
| Capture (all forms incl. floor-plan gate) | `submitLead` → `/api/leads` | ✅ live |
| Store (audit row) | D1 `leads` | ✅ live |
| CRM contact + pipeline opportunity, assigned to Jad | `src/lib/ghl.ts` → pinned pipeline `cGvlBKG1EBoj47Cg5v5K` | ✅ live |
| Instant owner alert email (+ wa.me for phone leads) | `src/lib/leads-notify.ts` → `LEAD_NOTIFY_EMAIL` | ✅ live |
| Lead auto-acknowledgement email (email-bearing leads) | `src/lib/leads-notify.ts` | ✅ live |
| **Lead-facing WhatsApp/SMS auto-reply + nurture drip** | **GHL workflow (this doc)** | ⏳ needs one-time UI build |

The GHL public API **cannot create workflows** (UI-only), so this last leg is a
one-time manual build. Once built it is **source-agnostic forever**: it keys on
the shared `investoffplan` tag that *every* lead already gets, and branches
inside on the per-source `iop-<formType>` tag for tailored copy. Adding a new
lead source later needs **zero** GHL changes.

## Every lead already arrives tagged

`src/lib/ghl.ts` upserts each contact with:
- `investoffplan` — on **every** lead (the shared trigger tag)
- `iop-<formType>` — e.g. `iop-floorplans`, `iop-brochure`, `iop-contact`
- placement tags when applicable (`premium-placement`, `placement:<surface>`)

## Build it (Automation → Workflows → Create Workflow → Start from scratch)

1. **Name**: `IOP Website Lead Intake`.
2. **Trigger**: *Contact Tag* → tag **`investoffplan`**. (Settings → allow
   re-entry ON, so a returning prospect re-enters on a new enquiry.)
3. **Actions**:
   1. **Internal notification** → Jad. Email and/or SMS:
      `New lead: {{contact.first_name}} {{contact.phone}} — {{contact.tags}}`.
      (Redundant with the code owner-alert on purpose — belt and braces.)
   2. **Send WhatsApp** (fallback **SMS** if WhatsApp isn't connected) to the
      lead — this is the piece the code can't do (most floor-plan/brochure
      leads are phone-only):
      `Hi {{contact.first_name}}, thanks for your interest on invest off-plan. A specialist will reach out shortly. Reply here anytime.`
   3. *(optional)* **If/Else** on tag `iop-floorplans` / `iop-brochure` / … →
      tailored follow-up copy; **Else** → generic nurture drip (Day 1 / Day 3 /
      Day 7 value touches).
4. **Publish.**

> WhatsApp requires an LC-WhatsApp or Twilio WhatsApp sender connected in GHL.
> If that isn't set up yet, use SMS in action 3.2 and swap to WhatsApp later —
> the workflow structure doesn't change.

## Optional: pin `GHL_WORKFLOW_ID` for guaranteed enrollment

The tag trigger above is enough. If you also want the code to **explicitly
enroll** every lead (fires even on the rare case where the tag was already
present on a returning contact), the enrollment call already exists in
`ghl.ts` (`POST /contacts/{id}/workflow/{workflowId}`) — it's just gated on the
env var being set:

```
# workflow ID is the last path segment of the workflow editor URL
npx wrangler secret put GHL_WORKFLOW_ID -c wrangler.production.jsonc
```

If you set this, turn the workflow trigger to **manual/API enrollment** (or
keep the tag trigger but set re-entry to *not* allow duplicates) so a lead
isn't enrolled twice.

## Verify

- Submit a test enquiry (or unlock floor plans) on investoffplan.com.
- Contact appears in GHL tagged `investoffplan` + `iop-<source>`, opportunity in
  the pinned pipeline assigned to Jad.
- The intake workflow shows the contact enrolled; WhatsApp/SMS auto-reply sent.
- Owner alert email lands in `iop@investoffplan.com` (code side).
