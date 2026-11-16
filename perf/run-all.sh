#!/usr/bin/env bash
# Re-runs every measurement in PERFORMANCE_RESULTS.md, LOCAL MACHINE ONLY. Total wall time is roughly 7 hours.
# Prerequisites: JDK 21, Maven, k6, Docker with docker-compose services (cbae-postgres, cbae-kafka) running,
# isolated database card_benefits_perf created (see perf/results/ENVIRONMENT.md). Never point this at a public URL:
# perf/k6/lib.js refuses any BASE_URL that is not localhost.
# Before/after comparisons need jars built from specific commits in perf/.ab/jars (built by step 4a below).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
RAW=perf/results/raw
build_jar_at() {  # build_jar_at <sha> <name> -> perf/.ab/jars/<name>.jar
  [ -f "perf/.ab/jars/$2.jar" ] && return 0
  mkdir -p perf/.ab/jars; git worktree add -q "perf/.ab/wt_$2" "$1"
  (cd "perf/.ab/wt_$2/backend" && mvn -q -DskipTests -Djacoco.skip=true package)
  cp "perf/.ab/wt_$2/backend/target/card-benefits-activation-engine-1.0.0-SNAPSHOT.jar" "perf/.ab/jars/$2.jar"
  git worktree remove --force "perf/.ab/wt_$2"
}

echo "== Phase 1: backend tests + JaCoCo, frontend Vitest"
(cd backend && mvn test > "../$RAW/phase1_backend_mvn_test.log" 2>&1)
(cd frontend && npx vitest run > "../$RAW/phase1_vitest.log" 2>&1)
(cd backend && mvn -q -DskipTests -Djacoco.skip=true package)   # jar used by the HTTP phases

echo "== Phase 2: JMH engine benchmark + sequential HTTP ingest latency"
perf/scripts/run-jmh.sh
perf/scripts/phase2b.sh

echo "== Phase 3: stepped load baseline (sequential session)"
perf/scripts/phase3.sh phase3

echo "== Phase 4: profiling + interleaved A/B of the N+1 fix"
build_jar_at 9d769bc pre_9d769bc; build_jar_at 0e46318 post_0e46318
perf/scripts/phase4_profile.sh phase4_before   # NOTE: uses backend/target jar; check out 9d769bc first for a true 'before'
perf/scripts/phase4_n1_evidence.sh
perf/scripts/phase4_ab.sh ingest
perf/scripts/phase4_ab.sh read
perf/scripts/phase4_ab.sh read250

echo "== Phase 5: Kafka pipeline (run on commit e85dcad for 'before', f14cbd3 or later for 'after')"
perf/scripts/phase5.sh phase5_rerun

echo "== Phase 6: claim workflow, duplicate-claim check"
perf/scripts/phase6.sh phase6_rerun
perf/scripts/phase6_retry.sh phase6_retry_rerun

echo "== Bug evidence: actuator health on the starting commit vs now"
build_jar_at 58a4a76 start_58a4a76
perf/scripts/phase0_actuator_ab.sh
perf/scripts/backend.sh stop
echo "done; raw outputs in $RAW"
