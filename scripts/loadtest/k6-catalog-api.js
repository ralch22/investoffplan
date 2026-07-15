// scripts/loadtest/k6-catalog-api.js — catalog API scenario.
// Mix of REPEATED keys (measures edge-cache hit ratio via x-iop-cache) and a
// small long-tail (exercises the in-isolate catalog memo). Run AFTER the
// catalog-cache wave (PR5) is deployed — before it, every request is a full
// ~13k-row D1 read.
import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "https://investoffplan-preview.emerge-digital.workers.dev";
const RPS = Math.min(Number(__ENV.MAX_RPS || 10), 30); // tighter ceiling: shared prod D1
const DURATION = Math.min(Number(__ENV.DURATION_S || 60), 300);

const cacheHits = new Rate("iop_edge_cache_hit");

export const options = {
  scenarios: {
    api: {
      executor: "constant-arrival-rate",
      rate: RPS,
      timeUnit: "1s",
      duration: `${DURATION}s`,
      preAllocatedVUs: 15,
      maxVUs: 40,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

// 80% default/common queries (cacheable), 20% long-tail filters.
const COMMON = [
  "/api/catalog/projects",
  "/api/catalog/projects?city=dubai",
  "/api/catalog/projects?beds=2",
  "/api/catalog/lite",
  "/api/catalog/map",
];

export default function () {
  const longTail = Math.random() < 0.2;
  const path = longTail
    ? `/api/catalog/projects?beds=${1 + Math.floor(Math.random() * 4)}&maxP=${(1 + Math.floor(Math.random() * 6)) * 500000}`
    : COMMON[Math.floor(Math.random() * COMMON.length)];
  const res = http.get(`${BASE_URL}${path}`, { tags: { kind: longTail ? "longtail" : "common" } });
  check(res, { "status 200": (x) => x.status === 200 });
  cacheHits.add(res.headers["X-Iop-Cache"] === "hit");
}
