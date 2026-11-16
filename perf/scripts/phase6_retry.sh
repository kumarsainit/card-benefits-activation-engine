#!/usr/bin/env bash
# Duplicate-claim check: 3 runs x N=100 opportunities (50 per key strategy), fresh JVM + reset DB each run.
# Duplicates counted from the claims table. usage: phase6_retry.sh LABEL
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw; L="${1:?label}"
for run in 1 2 3; do
  perf/scripts/backend.sh stop; perf/scripts/prerun.sh $RAW/${L}_run${run}_pre_db_counts.json > /dev/null
  BACKEND_LOG="$ROOT/perf/.backend_${L}_run$run.log" perf/scripts/backend.sh start > /dev/null
  k6 run -e N=100 -e SUMMARY_OUT=$RAW/${L}_run$run.json perf/k6/claim_retry.js > $RAW/${L}_run$run.txt 2>&1 || true
  docker exec cbae-postgres psql -U card_user -d card_benefits_perf -tA -c "
    select json_build_object('group', g, 'opportunities_submitted_twice', count(*), 'claims_rows', sum(n),
      'opportunities_with_more_than_one_claim', count(*) filter (where n > 1))
    from (select submission_notes g, opportunity_id, count(*) n from claims where submission_notes like 'retry-test %'
          group by 1, 2) x group by g order by g" > $RAW/${L}_run${run}_db_claims.json
  echo "$(date +%T) done $L run $run"; cat $RAW/${L}_run${run}_db_claims.json
done
perf/scripts/backend.sh stop
