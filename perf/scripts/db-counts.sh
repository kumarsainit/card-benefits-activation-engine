#!/usr/bin/env bash
# Print row counts from the isolated perf DB as JSON.
docker exec cbae-postgres psql -U card_user -d card_benefits_perf -tA -c "
select json_build_object(
 'transactions', (select count(*) from transactions),
 'transaction_events', (select count(*) from transaction_events),
 'opportunities', (select count(*) from benefit_opportunities),
 'claims', (select count(*) from claims),
 'dup_transaction_refs', (select count(*) from (select transaction_reference from transactions group by 1 having count(*)>1) d),
 'dup_idempotency_keys', (select count(*) from (select idempotency_key from transaction_events group by 1 having count(*)>1) d),
 'dup_opportunities', (select count(*) from (select transaction_id, benefit_type from benefit_opportunities group by 1,2 having count(*)>1) d))"
