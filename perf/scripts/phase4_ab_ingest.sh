#!/usr/bin/env bash
# Interleaved A/B of the ingest stepped profile: pre-fix jar (9d769bc) vs post-fix jar (0e46318), alternating
# A,B,A,B,A,B so slow drift in machine state affects both builds equally. Same stages/warm-up as phase3.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw
STAGES="25,100,200,400,600,800,1000,1200"
for run in 1 2 3; do
  for v in pre_9d769bc post_0e46318; do
    perf/scripts/backend.sh stop; perf/scripts/reset-db.sh
    BACKEND_JAR="$ROOT/perf/.ab/jars/$v.jar" BACKEND_LOG="$ROOT/perf/.backend_ab_${v}_run$run.log" \
      perf/scripts/backend.sh start --management.endpoints.web.exposure.include=health,info,metrics
    k6 run -q -e MODE=ingest -e STAGES=$STAGES -e STAGE_SECONDS=60 -e WARMUP_SECONDS=30 \
       -e SUMMARY_OUT=$RAW/phase4_ab_ingest_${v}_run$run.json perf/k6/stepped.js > $RAW/phase4_ab_ingest_${v}_run$run.txt 2>&1
    perf/scripts/db-counts.sh > $RAW/phase4_ab_ingest_${v}_run${run}_db_counts.json
    { echo "$(date +%T) done $v run $run; load avg: $(sysctl -n vm.loadavg)"; } | tee -a $RAW/phase4_ab_ingest_runner.log
  done
done
perf/scripts/backend.sh stop
for v in pre_9d769bc post_0e46318; do
  python3 perf/scripts/summarize_stepped.py $RAW/phase4_ab_ingest_${v}_run{1,2,3}.json > $RAW/phase4_ab_ingest_${v}_summary.txt
done
