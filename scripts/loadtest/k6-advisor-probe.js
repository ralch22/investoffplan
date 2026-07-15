// scripts/loadtest/k6-advisor-probe.js — GATED advisor probe.
// PURPOSE: prove the rate limiter engages — NOT to load the model.
// Fixed 1 rps for 45s (~45 requests vs the 10/60s binding): the PASS criterion
// is that 429s APPEAR. Real spend ceiling: ≤10 completions (≤50 inferences).
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "https://investoffplan-preview.emerge-digital.workers.dev";

const seen429 = new Counter("advisor_429_seen");
const seen5xx = new Counter("advisor_5xx_seen");

export const options = {
  scenarios: {
    probe: {
      executor: "constant-arrival-rate",
      rate: 1, // FIXED — do not parameterize; this endpoint bills per request
      timeUnit: "1s",
      duration: "45s",
      preAllocatedVUs: 3,
      maxVUs: 5,
    },
  },
  thresholds: {
    advisor_429_seen: ["count>0"], // limiter engaging IS the pass criterion
    advisor_5xx_seen: ["count==0"],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/advisor`,
    JSON.stringify({
      locale: "en",
      messages: [{ role: "user", content: "loadtest probe: what areas have launches?" }],
    }),
    {
      headers: { "Content-Type": "application/json" },
      responseCallback: http.expectedStatuses(200, 429),
    },
  );
  if (res.status === 429) seen429.add(1);
  if (res.status >= 500) seen5xx.add(1);
  check(res, { "200 or 429": (x) => x.status === 200 || x.status === 429 });
}
