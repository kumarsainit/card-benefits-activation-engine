#!/usr/bin/env bash
# GET /actuator/health (Render's healthCheckPath) on the starting commit 58a4a76 vs the current build.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; OUT=perf/results/raw/phase0_actuator_before_after.txt; : > $OUT
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
for jar in perf/.ab/jars/start_58a4a76.jar backend/target/card-benefits-activation-engine-1.0.0-SNAPSHOT.jar; do
  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/card_benefits_perf "$JAVA_HOME/bin/java" -jar $jar > perf/.backend_actuator_check.log 2>&1 &
  PID=$!
  for i in $(seq 1 90); do curl -s -o /dev/null localhost:8080/api/v1/auth/login && break; sleep 1; done
  echo "== $jar" >> $OUT
  curl -s -w '\nHTTP %{http_code}\n' localhost:8080/actuator/health >> $OUT
  kill $PID; wait $PID 2>/dev/null || true; sleep 2
done
cat $OUT
