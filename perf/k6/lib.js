// Shared helpers for the k6 scripts. Local backend only.
import http from 'k6/http';
import exec from 'k6/execution';

export const BASE = __ENV.BASE_URL || 'http://localhost:8080';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  throw new Error(`Refusing to load-test non-local target ${BASE}`);
}
export const API = `${BASE}/api/v1`;
export const RUN_ID = __ENV.RUN_ID || `${Date.now()}`;

// Seeded demo cardholder (V3__update_demo_credentials.sql) and seeded cards (V2__seed_demo_data.sql).
const EMAIL = 'customer@example.com';
const PASSWORD = 'Password123!';
export const CARD_PLATINUM = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // PURCHASE_PROTECTION + RETURN_PROTECTION
export const CARD_SAPPHIRE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; // TRAVEL_DELAY + PURCHASE_PROTECTION

export function login() {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' }, responseType: 'text' });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${res.body}`);
  const data = res.json('data');
  return data.accessToken || data.token;
}

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

const TRAVEL_JSON = JSON.stringify({
  carrierName: 'Delta Air Lines', carrierCode: 'DL', flightNumber: 'DL 1492', departureAirport: 'JFK',
  arrivalAirport: 'SFO', delayDurationHours: 7, delayReason: 'WEATHER',
});

// Four scenarios, chosen round-robin by iteration. expectedOpps = opportunities the engine must create.
export const SCENARIOS = [
  { name: 'purchase_electronics', expectedOpps: 2, // PP + RP on Platinum
    body: (ref) => ({ cardId: CARD_PLATINUM, transactionReference: ref, amount: 1499.0, currency: 'USD',
      merchantName: 'BEST BUY #1024 SAN FRANCISCO CA', mccCode: '5732', merchantCategory: 'Electronics Store',
      transactionTimestamp: daysAgo(5), productCategory: 'ELECTRONICS' }) },
  { name: 'return_apparel', expectedOpps: 2, // RP + PP on Platinum
    body: (ref) => ({ cardId: CARD_PLATINUM, transactionReference: ref, amount: 280.0, currency: 'USD',
      merchantName: 'ZARA BOUTIQUE #44 NEW YORK NY', mccCode: '5651', merchantCategory: 'Family Clothing Store',
      transactionTimestamp: daysAgo(20), productCategory: 'APPAREL' }) },
  { name: 'travel_delay', expectedOpps: 2, // TD + PP on Sapphire
    body: (ref) => ({ cardId: CARD_SAPPHIRE, transactionReference: ref, amount: 450.0, currency: 'USD',
      merchantName: 'DELTA AIR 0062341234 ATLANTA GA', mccCode: '3000', merchantCategory: 'Airlines',
      transactionTimestamp: daysAgo(2), travelMetadataJson: TRAVEL_JSON, productCategory: 'AIRLINE_TRAVEL' }) },
  { name: 'ineligible_excluded_mcc', expectedOpps: 0, // PP excluded (6011), TD not travel -> 0
    body: (ref) => ({ cardId: CARD_SAPPHIRE, transactionReference: ref, amount: 900.0, currency: 'USD',
      merchantName: 'CASH WITHDRAWAL 4471', mccCode: '6011', merchantCategory: 'Financial Institution',
      transactionTimestamp: daysAgo(3) }) },
];

export function uniqueKey(prefix) {
  return `${prefix}-${RUN_ID}-${exec.vu.idInTest}-${exec.vu.iterationInInstance}`;
}

export function ingest(token, scenario, key, tags = {}) {
  return http.post(`${API}/transactions/ingest`, JSON.stringify(scenario.body(key)), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
    tags: Object.assign({ name: 'ingest', scenario_kind: scenario.name }, tags),
  });
}

export function authGet(token, path, name) {
  return http.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, tags: { name } });
}

export const TREND_STATS = ['min', 'med', 'p(50)', 'p(95)', 'p(99)', 'max', 'avg', 'count'];
