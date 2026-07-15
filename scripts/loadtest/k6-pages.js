// scripts/loadtest/k6-pages.js — page-route load scenario.
// SAFETY: never defaults to prod; RPS and duration are hard-capped IN CODE.
// Run: BASE_URL=https://investoffplan.com MAX_RPS=20 DURATION_S=120 k6 run scripts/loadtest/k6-pages.js
import http from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "https://investoffplan-preview.emerge-digital.workers.dev";
const RPS = Math.min(Number(__ENV.MAX_RPS || 10), 50); // hard ceiling 50 rps
const DURATION = Math.min(Number(__ENV.DURATION_S || 60), 300); // hard ceiling 5 min

const slugs = new SharedArray("slugs", () =>
  JSON.parse(open("./slugs.json")),
);

export const options = {
  scenarios: {
    pages: {
      executor: "constant-arrival-rate",
      rate: RPS,
      timeUnit: "1s",
      duration: `${DURATION}s`,
      preAllocatedVUs: 20,
      maxVUs: 60,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.01"],
  },
};

const ROUTES = [
  "/",
  "/projects",
  "/communities",
  "/ar/projects",
];

export default function () {
  const r = Math.random();
  let path;
  if (r < 0.4) path = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  else path = `/projects/${slugs[Math.floor(Math.random() * slugs.length)]}`;
  const res = http.get(`${BASE_URL}${path}`, {
    tags: { kind: path.startsWith("/projects/") ? "pdp" : "page" },
  });
  check(res, { "status 200": (x) => x.status === 200 });
}
