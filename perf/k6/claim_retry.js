// Phase 6 duplicate-claim check: for each of N fresh opportunities, submit the SAME claim body twice
// (a client retry, e.g. after a timeout whose request actually succeeded).
//   group "wizard_keys": a new Idempotency-Key per attempt, exactly as claim-activation-wizard.tsx builds it
//                        (`idemp-claim-${opportunity.id}-${Date.now()}`)
//   group "stable_key" : the same Idempotency-Key on both attempts
// Duplicates are counted afterwards from the claims table (perf/scripts/phase6_retry.sh), not from status codes.
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { API, login, SCENARIOS, uniqueKey } from './lib.js';

const status = new Counter('retry_submit_status');
// Sub-metrics are only reported for tag sets that have a threshold, so enumerate the plausible status codes.
const thresholds = {};
for (const g of ['wizard_keys', 'stable_key']) for (const a of ['first', 'retry']) for (const c of ['200', '201', '400', '404', '409', '422', '500'])
  thresholds[`retry_submit_status{group:${g},attempt:${a},code:${c}}`] = ['count>=0'];
for (const g of ['wizard_keys', 'stable_key']) thresholds[`retry_submit_status{group:${g},attempt:no_opportunity,code:0}`] = ['count>=0'];
export const options = { thresholds, scenarios: { r: { executor: 'shared-iterations', vus: 1, iterations: Number(__ENV.N || 100), maxDuration: '10m' } } };
export function setup() { return { token: login() }; }

export default function (data) {
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` };
  const i = exec.scenario.iterationInTest;
  const group = i % 2 === 0 ? 'wizard_keys' : 'stable_key';
  const key = uniqueKey('retry');
  const tx = http.post(`${API}/transactions/ingest`, JSON.stringify(SCENARIOS[0].body(key)), { headers: Object.assign({ 'Idempotency-Key': key }, h) }).json('data.id');
  const opp = (http.get(`${API}/opportunities`, { headers: h }).json('data') || []).find((o) => o.transactionId === tx && o.benefitType === 'PURCHASE_PROTECTION');
  if (!opp) { status.add(1, { group, attempt: 'no_opportunity', code: '0' }); return; }
  const body = JSON.stringify({ opportunityId: opp.id, transactionId: opp.transactionId, cardBenefitId: opp.benefitId,
    requestedAmount: Number(opp.potentialClaimAmount), incidentDate: new Date().toISOString(), submissionNotes: `retry-test ${group}`, initialEvidence: [] });
  const stableKey = `idemp-claim-${opp.id}-${Date.now()}`;
  for (const attempt of ['first', 'retry']) {
    const k = group === 'stable_key' ? stableKey : `idemp-claim-${opp.id}-${Date.now()}`;
    const r = http.post(`${API}/claims`, body, { headers: Object.assign({ 'Idempotency-Key': k }, h) });
    status.add(1, { group, attempt, code: String(r.status) });
    if (i < 2) console.log(`${group} ${attempt}: ${r.status} ${String(r.body).slice(0, 200)}`);
    sleep(0.01);
  }
}

export function handleSummary(data) {
  const rows = {};
  for (const [k, v] of Object.entries(data.metrics)) if (k.startsWith('retry_submit_status{') && v.values.count > 0) rows[k] = v.values.count;
  const out = { stdout: JSON.stringify(rows, null, 1) + '\n' };
  if (__ENV.SUMMARY_OUT) out[__ENV.SUMMARY_OUT] = JSON.stringify({ status_counts: rows }, null, 1);
  return out;
}
