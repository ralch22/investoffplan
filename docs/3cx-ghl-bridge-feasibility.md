# 3CX + 3CX→GHL Lead Bridge for Invest Off Plan — Feasibility (2026-07-08)

**Question:** can phone calls to an IOP number become qualified leads in
GoHighLevel automatically — reusing the family 3CX and the proven SES "Aria"
pipeline?

**Short answer: yes — high feasibility, ~2–4 days of engineering, because
every hard part already runs in production for SES.** The one genuinely new
piece is a UAE inbound number (DID/SIP trunk), which is a procurement task,
not an engineering one.

## What already exists (proven in production)

| Asset | State |
|---|---|
| Self-hosted 3CX v20 on GCP (`cx-2026`, alcheikh.3cx.com.au) | Live; runs the family PBX + SES's Aria AI receptionist (ext 14) |
| Call→lead pipeline (SES) | **Live since 2026-06-11, created real jobs**: recording → GCS uploader (cron on the 3CX VM) → faster-whisper STT → LLM extract/qualify → API POST, with DLQ + retries + caller-ID guard |
| Lead ingestion on IOP side | This week's `/api/leads` → D1 store-first → GHL contact upsert (verified against the live location today, contact created + tagged) |
| GHL location | "Invest Off Plan" (`Xh73WHvCqidcrgTGCzBC`), private-integration token working; internal (token-grabber) API access verified viable |

## Proposed architecture (IOP variant of the SES bridge)

```
UAE DID ──► 3CX (new IOP AI-receptionist ext, Aria-style prompt in EN/AR)
              │ call recorded
              ▼
        GCS uploader cron (same script, new prefix gs://…/fresh-iop/)
              ▼
        processor cron (same VM pattern): STT → LLM extract
        {name, phone(callerID), budget, project/area interest, language}
              ▼
        POST https://investoffplan.com/api/leads
        (new formType "phone" — one-line addition to FORM_TYPES;
         retry-token-style auth header for server-to-server)
              ▼
        D1 lead row + GHL contact upsert (tags: investoffplan, iop-phone)
        └► GHL notify workflow → Jad (+971 58 527 6222 / +971 52 589 3197)
```

Reuse ratio is very high: uploader script, processor loop, DLQ, caller-ID
fallback, and prompt scaffolding are copy-adapt from
`/home/admin/aria-lead-bridge/` (SES Hermes VM) and
`/usr/local/bin/aria-rec-uploader.sh` (3CX VM).

## The new work

1. **UAE number (the real decision).** Options:
   - SIP trunk with UAE DID into 3CX (e.g. an international DID provider —
     note UAE regulates VoIP; a UAE-local DID terminated over SIP is the grey
     area to check, while a Wynn-style toll or a UK/US number is trivial but
     wrong market signal). Realistic clean option: **GHL LC Phone cannot issue
     UAE numbers either**, so an Etisalat/du SIP trunk into 3CX is the
     compliant route — needs a trade licence (Aria Properties LLC qualifies).
   - Keep the two mobile numbers for WhatsApp (already routed) and use the
     office +971 4 line forwarded into the DID/trunk once provisioned.
2. **New 3CX extension + Aria-style prompt** for IOP (bilingual EN/AR
   greeting; Arabic STT: faster-whisper handles `ar` — quality acceptable for
   lead capture since caller ID is the contact anchor, same guard as SES).
3. **`formType: "phone"`** in `/api/leads` + a server-to-server auth header
   (mirror of the retry-token pattern) — ~30 lines.
4. **Processor config** (new bucket prefix, IOP LLM prompt, POST target).

## Known limits (learned the hard way on SES — apply here)
- 3CX XAPI recordings/call-history stay 403 even for admin service
  principals → the GCS+STT path is the pattern; don't burn time on XAPI.
- Web-chat transcripts are unreachable via service principal → phone-first;
  chat leads already flow through the site forms anyway.
- Whisper mishears spoken phone numbers → caller ID is the contact of record;
  prompt reads the number back.
- Batch (cron) pipeline = minutes of latency, not real-time. Fine for lead
  capture; the GHL notify workflow makes Jad's follow-up the fast path.

## Cost estimate
- Engineering: ~2–4 days (mostly copy-adapt + prompt tuning + AR testing).
- Runtime: negligible on the existing VMs (SES's costs ~$0.001–0.01/call for
  STT+LLM via gpt-4o-mini-class models); UAE trunk/DID is the only recurring
  line item (provider-dependent, typically AED 100–300/mo + usage).
- 3CX licence: current instance has spare extension headroom (family + SES
  use a handful of the licence's extensions) — verify seat count before
  committing a dedicated queue.

## Alternative considered: GHL-native voice (LC Phone)
LC Phone gives calls + recordings + transcription inside GHL with zero infra —
but **no UAE numbers**, weaker AI-receptionist control, and per-minute pricing.
It's the right answer for US/UK brands; for a UAE brand the 3CX route wins on
number compliance and on reusing the proven stack.

## Recommendation
**GO, phased:** (1) provision the UAE trunk/DID under Aria Properties LLC —
longest lead time, start now; (2) meanwhile stand up the IOP extension +
`formType:"phone"` endpoint and test end-to-end with an internal extension
call; (3) go live when the DID lands. Decision needed from Rami: trunk
provider + whether calls route to an AI receptionist first or ring Jad with
AI-fallback after hours (3CX ring-group → AI on no-answer is a 10-minute
config and softens the "robot answers" risk).
