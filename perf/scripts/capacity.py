#!/usr/bin/env python3
"""Max sustainable stage per run, by the brief's definition only: highest stage such that it and every lower stage
have error rate < 1% and p95 < 500 ms. The achieved rate at that stage is printed alongside (k6 drops iterations
when it cannot start them; achieved < target means the target was not fully applied).
usage: capacity.py LABEL file...   -> per-run lines + median (min-max) across the given runs"""
import json, statistics, sys
label, files = sys.argv[1], sys.argv[2:]
caps = []
for f in files:
    best, ach = 0, None
    for st in json.load(open(f))['stages']:
        if (st['error_rate'] or 0) < 0.01 and st['p95_ms'] < 500: best, ach = st['stage_rps'], st['achieved_rps']
        else: break
    caps.append(best)
    print(f"{label} {f.split('/')[-1]}: max sustainable stage {best} req/s (achieved {ach} req/s at that stage)")
print(f"{label}: median {statistics.median(caps):g} req/s, min-max {min(caps)}-{max(caps)}, runs={caps}")
