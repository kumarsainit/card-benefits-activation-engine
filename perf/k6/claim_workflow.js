// Phase 6: API time for ingest -> opportunity detected -> opportunity detail (prefill) -> claim created,
// sequential (1 VU). The claim body is built exactly as frontend/components/claims/claim-activation-wizard.tsx
// builds it from the opportunity DTO (cardBenefitId: opportunity.benefitId, requestedAmount: potentialClaimAmount,
// incidentDate: today, default notes, no evidence).
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { API, login, SCENARIOS, uniqueKey, TREND_STATS } from './lib.js';

const tIngest = new Trend('wf_1_ingest_ms', true);
const tList = new Trend('wf_2_list_opportunities_ms', true);
const tDetail = new Trend('wf_3_opportunity_detail_ms', true);
const tClaim = new Trend('wf_4_submit_claim_ms', true);
const tTotal = new Trend('wf_total_ms', true);
const claimOk = new Counter('wf_claim_created');
const claimFail = new Counter('wf_claim_failed');
// ClaimSubmissionRequest has 7 fields. The wizard fills 4 of them from the opportunity DTO (opportunityId,
// transactionId, cardBenefitId, requestedAmount); incidentDate defaults to today, notes are a fixed default
// string and evidence is empty, so those 3 are not counted as prefilled from data.
const CLAIM_FIELDS_TOTAL = 7;
const prefilled = new Trend('wf_fields_prefilled_from_opportunity');

export const options = {
  scenarios: { wf: { executor: 'shared-iterations', vus: 1, iterations: Number(__ENV.ITERATIONS || 100), maxDuration: '20m' } },
  summaryTrendStats: TREND_STATS,
};

export function setup() { return { token: login() }; }

export default function (data) {
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` };
  const s = SCENARIOS[exec.scenario.iterationInTest % 3]; // the three eligible scenarios only
  const key = uniqueKey(`wf-${__ENV.KEY_PREFIX || 'm'}`);

  const r1 = http.post(`${API}/transactions/ingest`, JSON.stringify(s.body(key)), { headers: Object.assign({ 'Idempotency-Key': key }, h) });
  const txId = r1.json('data.id');
  const r2 = http.get(`${API}/opportunities`, { headers: h });
  const opp = (r2.json('data') || []).find((o) => o.transactionId === txId);
  if (!check(opp, { 'opportunity detected': (o) => !!o })) return;
  const r3 = http.get(`${API}/opportunities/${opp.id}`, { headers: h });
  const o = r3.json('data');
  const body = { // claim-activation-wizard.tsx handleSubmit()
    opportunityId: o.id, transactionId: o.transactionId, cardBenefitId: o.benefitId,
    requestedAmount: Number(o.potentialClaimAmount || o.transactionAmount || 0),
    incidentDate: new Date(new Date().toISOString().split('T')[0]).toISOString(),
    submissionNotes: 'Claim submitted via Card Benefit Activation Engine', initialEvidence: [],
  };
  prefilled.add(['opportunityId', 'transactionId', 'cardBenefitId', 'requestedAmount']
    .filter((k) => body[k] !== undefined && body[k] !== null && body[k] !== 0).length);
  const r4 = http.post(`${API}/claims`, JSON.stringify(body), { headers: Object.assign({ 'Idempotency-Key': `idemp-claim-${o.id}` }, h) });
  if (check(r4, { 'claim 201': (r) => r.status === 201 })) claimOk.add(1);
  else claimFail.add(1);
  if (exec.scenario.iterationInTest === 0) console.log(`first claim response: ${r4.status} ${String(r4.body).slice(0, 300)}`);

  tIngest.add(r1.timings.duration); tList.add(r2.timings.duration); tDetail.add(r3.timings.duration);
  tClaim.add(r4.timings.duration);
  tTotal.add(r1.timings.duration + r2.timings.duration + r3.timings.duration + r4.timings.duration);
}

export function handleSummary(data) {
  const pick = (k) => (data.metrics[k] ? data.metrics[k].values : null);
  const res = {};
  for (const k of ['wf_1_ingest_ms', 'wf_2_list_opportunities_ms', 'wf_3_opportunity_detail_ms', 'wf_4_submit_claim_ms', 'wf_total_ms', 'wf_claim_created', 'wf_claim_failed', 'wf_fields_prefilled_from_opportunity']) res[k] = pick(k);
  res.claim_fields_total = CLAIM_FIELDS_TOTAL;
  const out = { stdout: JSON.stringify(res, null, 1) + '\n' };
  if (__ENV.SUMMARY_OUT) out[__ENV.SUMMARY_OUT] = JSON.stringify({ workflow: res, k6: data }, null, 1);
  return out;
}
