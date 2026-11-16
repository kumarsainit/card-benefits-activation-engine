#!/usr/bin/env bash
# Phase 3 (and Phase 4 re-measure): stepped load, 3 runs per mode.
# usage: phase3.sh LABEL   (LABEL=phase3 for baseline, phase4_after for re-measure)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw
LABEL="${1:-phase3}"
INGEST_STAGES="25,100,200,400,600,800,1000,1200"
READ_STAGES="25,100,200,300,400,500,600,800,1000,1200"
JVM_FLAGS="--management.endpoints.web.exposure.include=health,info,metrics"
for mode in ingest read; do
  for run in 1 2 3; do
    perf/scripts/backend.sh stop; perf/scripts/reset-db.sh
    BACKEND_LOG="$ROOT/perf/.backend_${LABEL}_${mode}_run$run.log" perf/scripts/backend.sh start $JVM_FLAGS
    if [ "$mode" = read ]; then  # fixed data volume for reads: 200 transactions -> 300 opportunities
      k6 run -q -e ITERATIONS=200 -e KEY_PREFIX=seed perf/k6/ingest_sequential.js > /dev/null
    fi
    STAGES=$INGEST_STAGES; [ "$mode" = read ] && STAGES=$READ_STAGES
    k6 run -q -e MODE=$mode -e STAGES=$STAGES -e STAGE_SECONDS=60 -e WARMUP_SECONDS=30 \
       -e SUMMARY_OUT=$RAW/${LABEL}_${mode}_run$run.json perf/k6/stepped.js > $RAW/${LABEL}_${mode}_run$run.txt 2>&1
    perf/scripts/db-counts.sh > $RAW/${LABEL}_${mode}_run${run}_db_counts.json
    echo "$(date +%T) done $LABEL $mode run $run"
  done
done
perf/scripts/backend.sh stop
python3 perf/scripts/summarize_stepped.py $RAW/${LABEL}_ingest_run{1,2,3}.json > $RAW/${LABEL}_ingest_summary.txt
python3 perf/scripts/summarize_stepped.py $RAW/${LABEL}_read_run{1,2,3}.json > $RAW/${LABEL}_read_summary.txt
