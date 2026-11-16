#!/usr/bin/env python3
"""Summarize JMH JSON: per benchmark, mean of each fork, then median and min-max across forks."""
import json, statistics, sys
data = json.load(open(sys.argv[1]))
print(f"{'benchmark':58s} {'forks':>5s} {'median ns/op':>13s} {'min-max ns/op':>17s} {'median evals/s (1 thread)':>26s}")
for b in data:
    name = b['benchmark'].split('.')[-1]
    forks = [statistics.mean(f) for f in b['primaryMetric']['rawData']]
    med = statistics.median(forks)
    print(f"{name:58s} {len(forks):5d} {med:13.1f} {min(forks):8.1f}-{max(forks):<8.1f} {1e9/med:26,.0f}")
