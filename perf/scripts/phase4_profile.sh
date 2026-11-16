#!/usr/bin/env bash
# Phase 4 profiling of the dashboard read path. usage: phase4_profile.sh LABEL (phase4_before | phase4_after)
#  1. Per-request SQL statement counts (Hibernate SQL log) for each dashboard endpoint, seeded 200 tx / 300 opps.
#  2. EXPLAIN (ANALYZE, BUFFERS) of the opportunity list query.
#  3. Hikari pool metrics + 3 thread dumps (jcmd) while reads are held at 400 req/s for 60 s.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw
L="${1:?label}"; LOG="$ROOT/perf/.backend_${L}_sql.log"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
CUST=$(docker exec cbae-postgres psql -U card_user -d card_benefits_perf -tA -c "select id from customers where email='customer@example.com'")

perf/scripts/backend.sh stop; perf/scripts/reset-db.sh
BACKEND_LOG="$LOG" perf/scripts/backend.sh start --management.endpoints.web.exposure.include=health,info,metrics \
  --logging.level.org.hibernate.SQL=DEBUG
k6 run -q -e ITERATIONS=200 -e KEY_PREFIX=seed perf/k6/ingest_sequential.js > /dev/null
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"customer@example.com","password":"Password123!"}' | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print(d.get("accessToken") or d.get("token"))')
OUT=$RAW/${L}_sql_per_request.txt; : > "$OUT"
for ep in cards opportunities transactions claims; do
  for i in 1 2 3; do  # 3rd call is reported (first calls include lazy init)
    before=$(grep -c 'org.hibernate.SQL' "$LOG" || true)
    body=$(curl -s -w ' HTTP%{http_code} %{time_total}s' localhost:8080/api/v1/$ep -H "Authorization: Bearer $TOKEN")
    sleep 0.3; after=$(grep -c 'org.hibernate.SQL' "$LOG" || true)
  done
  rows=$(echo "$body" | python3 -c 'import sys,json;s=sys.stdin.read();print(len(json.loads(s[:s.rfind(" HTTP")])["data"]))' 2>/dev/null || echo '?')
  echo "GET /api/v1/$ep rows=$rows sql_statements=$((after-before)) ${body##* HTTP}" | tee -a "$OUT"
done
curl -s -o /dev/null localhost:8080/api/v1/opportunities -H "Authorization: Bearer $TOKEN"; sleep 0.5  # last request in the log
python3 perf/scripts/sql_shapes.py "$LOG" >> "$OUT"

docker exec cbae-postgres psql -U card_user -d card_benefits_perf -c "
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM benefit_opportunities WHERE customer_id='$CUST' ORDER BY created_at DESC;" \
  > $RAW/${L}_explain_opportunities.txt
docker exec cbae-postgres psql -U card_user -d card_benefits_perf -c "
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM transaction_events WHERE idempotency_key='seed-x';
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM transactions WHERE transaction_reference='seed-x';
EXPLAIN (ANALYZE, BUFFERS) SELECT 1 FROM benefit_opportunities WHERE transaction_id='00000000-0000-0000-0000-000000000000' AND benefit_type='PURCHASE_PROTECTION';" \
  > $RAW/${L}_explain_ingest_lookups.txt
perf/scripts/backend.sh stop

# 3. pool metrics + thread dumps under 400 req/s reads (without SQL logging)
BACKEND_LOG="$ROOT/perf/.backend_${L}_load.log" perf/scripts/backend.sh start --management.endpoints.web.exposure.include=health,info,metrics
PID=$(cat perf/.backend.pid)
k6 run -q -e MODE=read -e STAGES=400 -e STAGE_SECONDS=60 -e WARMUP_SECONDS=30 \
   -e SUMMARY_OUT=$RAW/${L}_read400.json perf/k6/stepped.js > $RAW/${L}_read400.txt 2>&1 &
K6=$!
M=$RAW/${L}_hikari_metrics.txt; : > "$M"
sleep 40
for s in 1 2 3 4 5 6; do
  { echo "t+$((s*5+40))s"; for m in hikaricp.connections.active hikaricp.connections.pending hikaricp.connections.max tomcat.threads.busy; do
      printf '  %s ' $m; curl -s localhost:8080/actuator/metrics/$m | python3 -c 'import sys,json;print(json.load(sys.stdin)["measurements"][0]["value"])' 2>/dev/null || echo n/a; done; } >> "$M"
  [ $s -le 3 ] && "$JAVA_HOME/bin/jcmd" $PID Thread.print > $RAW/${L}_threaddump_$s.txt 2>&1
  sleep 5
done
curl -s localhost:8080/actuator/metrics/hikaricp.connections.acquire >> "$M"; echo >> "$M"
wait $K6
perf/scripts/backend.sh stop
python3 - "$RAW/${L}_threaddump_"{1,2,3}.txt > $RAW/${L}_threaddump_summary.txt <<'PY'
import sys,re,collections
for f in sys.argv[1:]:
    txt=open(f).read(); blocks=txt.split('\n\n'); c=collections.Counter()
    for b in blocks:
        if 'http-nio-8080-exec' not in b.split('\n')[0]: continue
        st=re.search(r'java.lang.Thread.State: (\S+)',b); frames=[l.strip() for l in b.split('\n') if l.strip().startswith('at ')]
        key='other'
        for fr in frames:
            if 'HikariPool.getConnection' in fr or 'ConcurrentBag.borrow' in fr: key='waiting for Hikari connection'; break
            if 'SocketDispatcher.read' in fr or 'PgStream' in fr or 'NioSocketImpl.read' in fr: key='in Postgres I/O (query)'; break
            if 'com.fasterxml.jackson' in fr: key='Jackson (JSON)'; break
            if 'NioEndpoint' in fr or 'TaskQueue.take' in fr or 'TaskQueue.poll' in fr: key='idle (waiting for request)'; break
        c[f"{key} [{st.group(1) if st else '?'}]"]+=1
    print(f, dict(c.most_common()))
PY
cat $RAW/${L}_sql_per_request.txt | head -8; cat $M; cat $RAW/${L}_threaddump_summary.txt
