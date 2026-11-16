#!/usr/bin/env bash
# Before every measured run: reset the isolated perf DB and record its row counts (proves identical start data).
# usage: prerun.sh OUT_JSON
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
"$ROOT/perf/scripts/reset-db.sh" > /dev/null
docker exec cbae-postgres psql -U card_user -d card_benefits_perf -tA -c "
select json_build_object('customers',(select count(*) from customers),'cards',(select count(*) from cards),
 'card_benefits',(select count(*) from card_benefits),'benefit_rules',(select count(*) from benefit_rules),
 'transactions',(select count(*) from transactions),'transaction_events',(select count(*) from transaction_events),
 'opportunities',(select count(*) from benefit_opportunities),'claims',(select count(*) from claims),
 'claim_evidences',(select count(*) from claim_evidences),'notifications',(select count(*) from notifications),
 'audit_events',(select count(*) from audit_events))" > "$1"
cat "$1"
