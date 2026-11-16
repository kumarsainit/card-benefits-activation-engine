#!/usr/bin/env python3
"""Per stage: median (min-max) across runs. Max sustainable = highest stage where, in the MEDIAN run values,
error_rate < 1%, p95 < 500 ms and achieved >= 99% of target (no meaningful dropped iterations)."""
import json, statistics, sys
runs = [json.load(open(f))['stages'] for f in sys.argv[1:]]
def fmt(xs, nd=1): return f"{statistics.median(xs):.{nd}f} ({min(xs):.{nd}f}-{max(xs):.{nd}f})"
print(f"runs: {len(runs)}  files: {' '.join(sys.argv[1:])}")
print(f"{'target':>6} | {'achieved req/s':>22} | {'p50 ms':>20} | {'p95 ms':>22} | {'p99 ms':>22} | {'error %':>16} | dropped")
best = None
for i, st in enumerate(runs[0]):
    col = lambda k: [r[i][k] if r[i][k] is not None else 0 for r in runs]
    ach, p50, p95, p99 = col('achieved_rps'), col('p50_ms'), col('p95_ms'), col('p99_ms')
    err = [100 * x for x in col('error_rate')]; drop = col('dropped_iterations')
    print(f"{st['stage_rps']:>6} | {fmt(ach):>22} | {fmt(p50):>20} | {fmt(p95):>22} | {fmt(p99):>22} | {fmt(err,2):>16} | {drop}")
    if statistics.median(err) < 1 and statistics.median(p95) < 500 and statistics.median(ach) >= 0.99 * st['stage_rps']:
        best = st['stage_rps']
print(f"max sustainable stage (err<1%, p95<500ms, achieved>=99% of target, median of runs): {best} req/s")
