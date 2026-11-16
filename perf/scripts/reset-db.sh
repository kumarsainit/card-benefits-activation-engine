#!/usr/bin/env bash
# Remove generated rows from the ISOLATED perf database only; keeps Flyway seed data.
# Never touches the dev database card_benefits_db.
set -euo pipefail
DB=card_benefits_perf
docker exec -i cbae-postgres psql -q -U card_user -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN IF current_database() <> 'card_benefits_perf' THEN RAISE EXCEPTION 'refusing to reset %', current_database(); END IF; END $$;
TRUNCATE claim_evidences, claims, benefit_opportunities, transaction_events, transactions, notifications, audit_events;
VACUUM ANALYZE;
SQL
echo "perf db reset"
