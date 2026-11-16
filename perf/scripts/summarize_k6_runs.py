#!/usr/bin/env python3
"""Median and min-max across runs for k6 handleSummary JSON files.
usage: summarize_k6_runs.py METRIC_KEY file1.json file2.json ..."""
import json, statistics, sys
key, files = sys.argv[1], sys.argv[2:]
vals = [json.load(open(f))['metrics'][key]['values'] for f in files]
for stat in ['p(50)', 'p(95)', 'p(99)', 'avg', 'max', 'count', 'rate']:
    xs = [v[stat] for v in vals if stat in v]
    if xs: print(f"{key} {stat:6s} median={statistics.median(xs):.2f} min={min(xs):.2f} max={max(xs):.2f} runs={[round(x,2) for x in xs]}")
