#!/usr/bin/env bash
# Phase 6: claim workflow API timing + prefill count. 3 runs, fresh JVM + reset perf DB each run,
# 30-iteration warm-up (discarded) then 99 measured iterations (33 per eligible scenario), 1 VU.
# usage: phase6.sh LABEL (phase6_before | phase6_after)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw; L="${1:?label}"
for run in 1 2 3; do
  perf/scripts/backend.sh stop; perf/scripts/prerun.sh $RAW/${L}_run${run}_pre_db_counts.json > /dev/null
  BACKEND_LOG="$ROOT/perf/.backend_${L}_run$run.log" perf/scripts/backend.sh start
  k6 run -q -e ITERATIONS=30 -e KEY_PREFIX=warm perf/k6/claim_workflow.js > /dev/null 2>&1 || true
  k6 run -e ITERATIONS=99 -e KEY_PREFIX=m$run -e SUMMARY_OUT=$RAW/${L}_run$run.json perf/k6/claim_workflow.js \
     > $RAW/${L}_run$run.txt 2>&1 || true
  perf/scripts/db-counts.sh > $RAW/${L}_run${run}_db_counts.json
  echo "$(date +%T) done $L run $run"
done
perf/scripts/backend.sh stop
python3 - $RAW/${L}_run{1,2,3}.json > $RAW/${L}_summary.txt <<'PY'
import json, statistics, sys
runs = [json.load(open(f))['workflow'] for f in sys.argv[1:]]
print("runs:", sys.argv[1:])
for k in ['wf_1_ingest_ms', 'wf_2_list_opportunities_ms', 'wf_3_opportunity_detail_ms', 'wf_4_submit_claim_ms', 'wf_total_ms']:
    for st in ['p(50)', 'p(95)']:
        xs = [r[k][st] for r in runs if r[k]]
        if xs: print(f"{k:32s} {st:6s} median={statistics.median(xs):8.2f} min={min(xs):8.2f} max={max(xs):8.2f}")
for k in ['wf_claim_created', 'wf_claim_failed']:
    print(k, [(r[k] or {}).get('count', 0) for r in runs])
print('fields prefilled from opportunity (avg per run):', [r['wf_fields_prefilled_from_opportunity']['avg'] for r in runs],
      'of', runs[0]['claim_fields_total'])
PY
cat $RAW/${L}_summary.txt; grep -h "first claim response" $RAW/${L}_run*.txt | head -3
