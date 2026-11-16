#!/usr/bin/env bash
# N+1 fix evidence on ONE dataset: seed 200 tx once, then serve GET /opportunities from the pre-fix jar and the
# post-fix jar (no reset in between). Saves both JSON bodies, their diff, and every SQL statement of one request.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"; RAW=perf/results/raw; P=$RAW/phase4_n1
perf/scripts/backend.sh stop
perf/scripts/prerun.sh ${P}_pre_db_counts.json > /dev/null
token() { curl -s -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"customer@example.com","password":"Password123!"}' | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print(d.get("accessToken") or d.get("token"))'; }
seeded=0
for v in pre_9d769bc post_0e46318; do
  LOG="$ROOT/perf/.backend_n1_$v.log"
  BACKEND_JAR="$ROOT/perf/.ab/jars/$v.jar" BACKEND_LOG="$LOG" perf/scripts/backend.sh start --logging.level.org.hibernate.SQL=DEBUG \
    --spring.jpa.properties.hibernate.format_sql=false > /dev/null
  if [ $seeded = 0 ]; then k6 run -q -e ITERATIONS=200 -e KEY_PREFIX=seed perf/k6/ingest_sequential.js > /dev/null; seeded=1
    perf/scripts/db-counts.sh > ${P}_dataset_db_counts.json; fi
  T=$(token)
  for i in 1 2; do curl -s -o /dev/null localhost:8080/api/v1/opportunities -H "Authorization: Bearer $T"; done  # warm
  sleep 0.5; before=$(wc -l < "$LOG")
  curl -s localhost:8080/api/v1/opportunities -H "Authorization: Bearer $T" > ${P}_${v}_body.json
  sleep 0.5
  tail -n +$((before+1)) "$LOG" | grep 'org.hibernate.SQL' | sed -E 's/.*org\.hibernate\.SQL *: //' > ${P}_${v}_sql.txt
  echo "$v: $(wc -l < ${P}_${v}_sql.txt | tr -d ' ') SQL statements in one GET /opportunities request" | tee -a ${P}_summary.txt
  perf/scripts/backend.sh stop
done
python3 - ${P}_pre_9d769bc_body.json ${P}_post_0e46318_body.json >> ${P}_summary.txt <<'PY'
import json, sys
a, b = (json.load(open(f)) for f in sys.argv[1:])
print("opportunities in body:", len(a["data"]), len(b["data"]))
print("JSON bodies identical (parsed, key order ignored):", a == b)
print("raw bytes identical:", open(sys.argv[1], 'rb').read() == open(sys.argv[2], 'rb').read())
PY
python3 -m json.tool --sort-keys ${P}_pre_9d769bc_body.json > ${P}_pre.pretty.json
python3 -m json.tool --sort-keys ${P}_post_0e46318_body.json > ${P}_post.pretty.json
diff -u ${P}_pre.pretty.json ${P}_post.pretty.json > ${P}_body.diff && echo "diff -u: no differences (0 bytes)" >> ${P}_summary.txt || echo "diff -u: DIFFERENCES, see ${P}_body.diff" >> ${P}_summary.txt
rm -f ${P}_pre.pretty.json ${P}_post.pretty.json
cat ${P}_summary.txt
