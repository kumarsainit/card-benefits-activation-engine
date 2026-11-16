#!/usr/bin/env bash
# usage: phase4_ab.sh ingest|read|read250
#   read250 = read mix (4 dashboard endpoints round-robin) held at a fixed 250 req/s for 120 s, a rate both builds sustain
# Interleaved A/B of the stepped profile: pre-fix jar (9d769bc) vs post-fix jar (0e46318), alternating
# A,B,A,B,A,B so slow drift in machine state affects both builds equally. Same stages/warm-up as phase3.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw
MODE="${1:-ingest}"
STAGES="25,100,200,400,600,800,1000,1200"; [ "$MODE" = read ] && STAGES="25,100,200,300,400,500,600,800,1000,1200"
SECS=60; [ "$MODE" = read250 ] && { STAGES=250; SECS=120; }
K6MODE=$MODE; [ "$MODE" = read250 ] && K6MODE=read
for run in 1 2 3; do
  for v in pre_9d769bc post_0e46318; do
    perf/scripts/backend.sh stop; perf/scripts/prerun.sh $RAW/phase4_ab_${MODE}_${v}_run${run}_pre_db_counts.json > /dev/null
    BACKEND_JAR="$ROOT/perf/.ab/jars/$v.jar" BACKEND_LOG="$ROOT/perf/.backend_ab_${MODE}_${v}_run$run.log" \
      perf/scripts/backend.sh start --management.endpoints.web.exposure.include=health,info,metrics
    [ "$K6MODE" = read ] && k6 run -q -e ITERATIONS=200 -e KEY_PREFIX=seed perf/k6/ingest_sequential.js > /dev/null
    k6 run -q -e MODE=$K6MODE -e STAGES=$STAGES -e STAGE_SECONDS=$SECS -e WARMUP_SECONDS=30 \
       -e SUMMARY_OUT=$RAW/phase4_ab_${MODE}_${v}_run$run.json perf/k6/stepped.js > $RAW/phase4_ab_${MODE}_${v}_run$run.txt 2>&1
    perf/scripts/db-counts.sh > $RAW/phase4_ab_${MODE}_${v}_run${run}_db_counts.json
    { echo "$(date +%T) done $v run $run; load avg: $(sysctl -n vm.loadavg)"; } | tee -a $RAW/phase4_ab_${MODE}_runner.log
  done
done
perf/scripts/backend.sh stop
for v in pre_9d769bc post_0e46318; do
  python3 perf/scripts/summarize_stepped.py $RAW/phase4_ab_${MODE}_${v}_run{1,2,3}.json > $RAW/phase4_ab_${MODE}_${v}_summary.txt
done
