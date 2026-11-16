#!/usr/bin/env bash
# Phase 2b: sequential ingest->opportunity latency, 3 runs, each: reset DB, fresh JVM, 300 warm-up + 1000 measured.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw
for run in 1 2 3; do
  perf/scripts/backend.sh stop; perf/scripts/reset-db.sh
  BACKEND_LOG="$ROOT/perf/.backend_phase2b_run$run.log" perf/scripts/backend.sh start
  k6 run -q -e ITERATIONS=300 -e KEY_PREFIX=warm perf/k6/ingest_sequential.js > /dev/null
  k6 run -q -e ITERATIONS=1000 -e KEY_PREFIX=meas -e SUMMARY_OUT=$RAW/phase2b_e2e_ingest_run$run.json \
     perf/k6/ingest_sequential.js | tee $RAW/phase2b_e2e_ingest_run$run.txt
  perf/scripts/db-counts.sh | tee $RAW/phase2b_db_counts_run$run.json
done
perf/scripts/backend.sh stop
