#!/usr/bin/env bash
# Phase 5: Kafka pipeline reliability / idempotency / throughput / latency. 3 runs, fresh JVM + fresh topic each.
# usage: phase5.sh LABEL   (phase5_before | phase5_after)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT/backend"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
LABEL="${1:?label}"; RAW="$ROOT/perf/results/raw"
for run in 1 2 3; do
  "$ROOT/perf/scripts/prerun.sh" "$RAW/${LABEL}_run${run}_pre_db_counts.json" > /dev/null
  mvn test -Dtest=KafkaPipelinePerfTest -Dsurefire.excludedGroups= -Djacoco.skip=true \
      -Dsurefire.failIfNoSpecifiedTests=false -Dperf.label=${LABEL}_run$run -Dperf.out="$RAW" \
      > "$RAW/${LABEL}_run${run}_mvn.log" 2>&1 || { echo "run $run FAILED, see ${LABEL}_run${run}_mvn.log"; tail -30 "$RAW/${LABEL}_run${run}_mvn.log"; exit 1; }
  echo "$(date +%T) done $LABEL run $run"
done
python3 "$ROOT/perf/scripts/summarize_phase5.py" "$RAW/${LABEL}"_run{1,2,3}.json | tee "$RAW/${LABEL}_summary.txt"
