#!/usr/bin/env python3
"""Median (min-max) across Phase 5 run JSON files for the key reliability/throughput/latency figures."""
import json, statistics, sys
runs = [json.load(open(f)) for f in sys.argv[1:]]
def get(r, path):
    for k in path.split('.'): r = r[k]
    return r
keys = ['reliability.published', 'reliability.published_ok', 'reliability.published_transient_fail_once',
        'reliability.published_malformed_invalid_json', 'reliability.published_malformed_unknown_card',
        'reliability.injected_transient_failures_thrown', 'reliability.persisted_ok',
        'reliability.persisted_transient_recovered', 'reliability.persisted_unknown_card',
        'reliability.dlt_records_total', 'reliability.valid_events_lost', 'reliability.malformed_events_lost_without_trace',
        'reliability.events_unaccounted_total', 'reliability.db.dup_transaction_refs', 'reliability.db.dup_opportunities',
        'reliability.db.opportunities', 'reliability.expected_opportunities_for_persisted',
        'reliability.wall_clock_seconds_publish_to_drained',
        'throughput.persisted', 'throughput.events_per_second_first_to_last_persist',
        'throughput.events_per_second_publish_to_drained_wall_clock',
        'latency.eligible_events_measured', 'latency.p50_ms', 'latency.p95_ms', 'latency.p99_ms',
        'idempotency.rest_2xx', 'idempotency.rest_non_2xx', 'idempotency.new_transactions_created',
        'idempotency.new_opportunities_created', 'final_db.dup_idempotency_keys', 'final_db.dup_opportunities']
print("runs:", [r['label'] for r in runs])
for k in keys:
    xs = [get(r, k) for r in runs]
    print(f"{k:60s} median={statistics.median(xs):<10g} min={min(xs):<10g} max={max(xs):<10g} runs={xs}")
print("dlt_by_kind:", [get(r, 'reliability.dlt_records_by_kind') for r in runs])
