#!/usr/bin/env bash
# Start/stop the backend jar locally for measurements.
# Usage: perf/scripts/backend.sh start [extra JVM/Spring args...] | stop | wait
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
JAR="${BACKEND_JAR:-$ROOT/backend/target/card-benefits-activation-engine-1.0.0-SNAPSHOT.jar}"
PIDFILE="$ROOT/perf/.backend.pid"
LOG="${BACKEND_LOG:-$ROOT/perf/.backend.log}"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
# Always use the isolated perf database, never the dev database.
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/card_benefits_perf"

case "${1:-}" in
  start)
    shift
    "$JAVA_HOME/bin/java" ${JVM_OPTS:-} -jar "$JAR" "$@" >"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    "$0" wait
    ;;
  wait)
    for i in $(seq 1 120); do
      if curl -fsS http://localhost:8080/actuator/health 2>/dev/null | grep -q '"UP"'; then
        echo "backend UP after ${i}s (pid $(cat "$PIDFILE"))"; exit 0; fi
      sleep 1
    done
    echo "backend failed to start; tail of log:"; tail -40 "$LOG"; exit 1
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then kill "$(cat "$PIDFILE")" 2>/dev/null || true
      for i in $(seq 1 30); do kill -0 "$(cat "$PIDFILE")" 2>/dev/null || break; sleep 1; done
      rm -f "$PIDFILE"; fi
    ;;
  *) echo "usage: $0 start|stop|wait"; exit 2;;
esac
