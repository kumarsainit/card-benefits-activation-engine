// Phase 2b / 6: sequential (1 VU) ingest -> opportunity latency through HTTP + Spring + Postgres.
// ITERATIONS env sets count; scenarios rotate round-robin so each gets ITERATIONS/4.
import { check } from 'k6';
import exec from 'k6/execution';
import { login, ingest, uniqueKey, SCENARIOS, TREND_STATS } from './lib.js';

export const options = {
  scenarios: {
    seq: { executor: 'shared-iterations', vus: 1, iterations: Number(__ENV.ITERATIONS || 1000), maxDuration: '30m' },
  },
  summaryTrendStats: TREND_STATS,
  thresholds: {
    // Per-scenario sub-metrics so they appear in the summary.
    'http_req_duration{name:ingest}': ['max>=0'],
    'http_req_duration{scenario_kind:purchase_electronics}': ['max>=0'],
    'http_req_duration{scenario_kind:return_apparel}': ['max>=0'],
    'http_req_duration{scenario_kind:travel_delay}': ['max>=0'],
    'http_req_duration{scenario_kind:ineligible_excluded_mcc}': ['max>=0'],
  },
};

export function setup() { return { token: login() }; }

export default function (data) {
  const s = SCENARIOS[exec.scenario.iterationInTest % SCENARIOS.length];
  const res = ingest(data.token, s, uniqueKey(__ENV.KEY_PREFIX || 'seq'));
  check(res, { 'ingest 201': (r) => r.status === 201 });
}

export function handleSummary(data) {
  const out = __ENV.SUMMARY_OUT;
  const res = { stdout: JSON.stringify({ ingest: data.metrics['http_req_duration{name:ingest}'].values,
    failed: data.metrics.http_req_failed.values }, null, 1) + '\n' };
  if (out) res[out] = JSON.stringify(data, null, 1);
  return res;
}
