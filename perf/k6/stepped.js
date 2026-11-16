// Phase 3/4: stepped constant-arrival-rate load test against the LOCAL backend.
//   MODE=ingest : POST /transactions/ingest, unique Idempotency-Key per request, 4 payload scenarios round-robin.
//   MODE=read   : GET one of the 4 dashboard endpoints (cards, opportunities, transactions, claims) round-robin,
//                 the same calls frontend/features/dashboard/use-dashboard.ts makes.
// STAGES: comma-separated req/s, each held STAGE_SECONDS after a WARMUP_SECONDS warm-up at WARMUP_RATE.
import { check } from 'k6';
import exec from 'k6/execution';
import { login, ingest, authGet, uniqueKey, SCENARIOS, TREND_STATS } from './lib.js';

const MODE = __ENV.MODE || 'ingest';
const STAGES = (__ENV.STAGES || '25,50,100,200,400').split(',').map(Number);
const STAGE_S = Number(__ENV.STAGE_SECONDS || 60);
const WARM_S = Number(__ENV.WARMUP_SECONDS || 30);
const WARM_RATE = Number(__ENV.WARMUP_RATE || 25);
const READS = [['/cards', 'get_cards'], ['/opportunities', 'get_opportunities'],
               ['/transactions', 'get_transactions'], ['/claims', 'get_claims']];

const scenarios = {
  warmup: { executor: 'constant-arrival-rate', rate: WARM_RATE, timeUnit: '1s', duration: `${WARM_S}s`,
            preAllocatedVUs: 20, maxVUs: 200, startTime: '0s' },
};
const thresholds = {};
let t = WARM_S;
for (const r of STAGES) {
  const name = `s${r}`;
  scenarios[name] = { executor: 'constant-arrival-rate', rate: r, timeUnit: '1s', duration: `${STAGE_S}s`,
                      preAllocatedVUs: Math.min(r, 200), maxVUs: 1000, startTime: `${t}s`, gracefulStop: '10s' };
  t += STAGE_S + 10; // 10 s gap so a stage's in-flight requests drain before the next starts
  for (const m of ['http_req_duration', 'http_req_failed', 'http_reqs', 'dropped_iterations', 'iterations']) {
    thresholds[`${m}{scenario:${name}}`] = m === 'http_req_duration' ? ['max>=0']
      : m === 'http_req_failed' ? ['rate>=0'] : ['count>=0'];
  }
  if (MODE === 'read') for (const [, n] of READS) thresholds[`http_req_duration{scenario:${name},name:${n}}`] = ['max>=0'];
}

export const options = { scenarios, thresholds, summaryTrendStats: TREND_STATS, discardResponseBodies: true,
                         setupTimeout: '10m' };

export function setup() { return { token: login() }; }

export default function (data) {
  const i = exec.scenario.iterationInTest;
  if (MODE === 'ingest') {
    const s = SCENARIOS[i % SCENARIOS.length];
    const res = ingest(data.token, s, uniqueKey(`ld-${exec.scenario.name}`));
    check(res, { '201': (r) => r.status === 201 });
  } else {
    const [path, name] = READS[i % READS.length];
    const res = authGet(data.token, path, name);
    check(res, { '200': (r) => r.status === 200 });
  }
}

export function handleSummary(data) {
  const rows = [];
  for (const r of STAGES) {
    const n = `s${r}`; const m = (k) => data.metrics[`${k}{scenario:${n}}`];
    const reqs = m('http_reqs') ? m('http_reqs').values.count : 0;
    const failed = m('http_req_failed') ? m('http_req_failed').values : { passes: 0, fails: 0 };
    const total = (failed.passes || 0) + (failed.fails || 0);
    const d = m('http_req_duration') ? m('http_req_duration').values : {};
    rows.push({ stage_rps: r, achieved_rps: +(reqs / STAGE_S).toFixed(1), requests: reqs,
      error_rate: total ? +(failed.passes / total).toFixed(4) : null, // k6: "passes" of http_req_failed = failed reqs
      dropped_iterations: m('dropped_iterations') ? m('dropped_iterations').values.count : 0,
      p50_ms: d['p(50)'], p95_ms: d['p(95)'], p99_ms: d['p(99)'], max_ms: d.max });
  }
  const out = { stdout: JSON.stringify(rows) + '\n' };
  if (__ENV.SUMMARY_OUT) out[__ENV.SUMMARY_OUT] = JSON.stringify({ mode: MODE, stages: rows, k6: data }, null, 1);
  return out;
}
