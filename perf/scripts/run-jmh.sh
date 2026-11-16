#!/usr/bin/env bash
# Phase 2a: JMH engine benchmark (3 forks x 5 measurement iterations, after 5 warm-up iterations per fork).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT/backend"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
OUT="$ROOT/perf/results/raw"
mvn -q test-compile dependency:build-classpath -Dmdep.outputFile=target/bench.cp -Dmdep.includeScope=test
CP="target/test-classes:target/classes:$(cat target/bench.cp)"
"$JAVA_HOME/bin/java" -cp "$CP" org.openjdk.jmh.Main 'com.cbae.engine.bench.EngineEvaluationBenchmark' \
  -rf json -rff "$OUT/phase2_jmh_engine.json" 2>&1 | tee "$OUT/phase2_jmh_engine.log"
