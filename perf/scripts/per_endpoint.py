#!/usr/bin/env python3
"""Per-endpoint p50/p95 at given read stages: median (min-max) across run JSON files. usage: per_endpoint.py STAGE files..."""
import json, statistics, sys
st = sys.argv[1]; files = sys.argv[2:]
for n in ('get_cards', 'get_opportunities', 'get_transactions', 'get_claims'):
    out = []
    for q in ('p(50)', 'p(95)'):
        xs = [json.load(open(f))['k6']['metrics'][f'http_req_duration{{scenario:s{st},name:{n}}}']['values'][q] for f in files]
        out.append(f"{q} {statistics.median(xs):.1f} ({min(xs):.1f}-{max(xs):.1f})")
    print(f"stage {st} {n:18s} " + '  '.join(out))
