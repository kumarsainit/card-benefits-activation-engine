#!/usr/bin/env python3
"""Group the statements of the most recent GET /opportunities request in a Hibernate SQL debug log by
(main table, where clause). The request starts at the last statement that reads FROM benefit_opportunities."""
import re, sys, collections
txt = open(sys.argv[1]).read()
stmts = [s.split('\n', 1)[1] if '\n' in s else '' for s in re.split(r'\n(?=\S+ DEBUG .*org\.hibernate\.SQL)', txt) if 'org.hibernate.SQL' in s.split('\n', 1)[0]]
stmts = [re.split(r'\n\S', s)[0] for s in stmts]  # drop following non-SQL log lines
start = max(i for i, s in enumerate(stmts) if re.search(r'from\s+benefit_opportunities', s))
c = collections.Counter()
for s in stmts[start:]:
    flat = ' '.join(s.split())
    tbl = re.search(r'\bfrom (\w+)', flat); where = re.search(r'\bwhere (.*?)(?: order by|$)', flat)
    c[f"{flat.split()[0]} from {tbl.group(1) if tbl else '?'} where {where.group(1) if where else '-'}"] += 1
print(f"statements in last /opportunities request: {sum(c.values())}")
for k, v in c.most_common(): print(f"{v:5d}  {k}")
