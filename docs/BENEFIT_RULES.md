# Card Protection Benefit Rules Specification

This document details the business logic, parameter definitions, and evaluation criteria for the initial card protection benefits supported by the platform.

---

## 1. Purchase Protection (`PURCHASE_PROTECTION`)

### Description
Reimburses the cardholder if an eligible item purchased with the enrolled card is stolen or accidentally damaged within a specified window after the purchase date.

### Rule Parameters
- **Coverage Window**: 90 to 120 days from transaction timestamp.
- **Maximum Per Incident Coverage**: Typically \$500 to \$10,000 depending on card tier.
- **Annual Aggregate Limit**: Typically \$50,000.
- **Deductible**: \$0.00.
- **Eligible Categories / MCCs**: Electronics (5732), Department Stores (5311), Appliances (5722), Computers (5045), Retail General (5999).
- **Ineligible Categories**: Motor vehicles, living animals, perishables, real estate, cash equivalents, tickets.

### Decision Criteria
1. Full or partial purchase was charged to the covered card.
2. Incident date occurred within `coverage_days` from `purchase_date`.
3. Purchase amount is within per-item coverage limit.
4. Transaction status is `COMPLETED` / `SETTLED`.

---

## 2. Return Protection (`RETURN_PROTECTION`)

### Description
Reimburses the cardholder when a merchant refuses to accept the return of an eligible item within a specified window from the original purchase date.

### Rule Parameters
- **Coverage Window**: 60 to 90 days from purchase date.
- **Per Item Limit**: \$250 to \$500.
- **Annual Max Limit**: \$1,000 to \$2,500.
- **Merchant Refusal Proof**: Required (written statement or return policy clause).
- **Eligible Items**: Brand-new condition tangible goods in working order.
- **Ineligible Items**: Custom-made items, software, perishables, jewelry, vehicles.

### Decision Criteria
1. Entire purchase paid with covered card.
2. Return attempted within coverage window.
3. Merchant return window is shorter than coverage window (or merchant denied return).
4. No prior approved return protection claim on the same line item.

---

## 3. Travel Delay Insurance (`TRAVEL_DELAY`)

### Description
Reimburses reasonable unreimbursed expenses (meals, lodging, toiletries, ground transit) incurred when a common carrier (airline, train, cruise) travel is delayed beyond a qualifying threshold.

### Rule Parameters
- **Minimum Delay Threshold**: 4 to 6 hours delay (or overnight delay).
- **Maximum Reimbursement**: \$300 to \$500 per ticket.
- **Eligible Expenses**: Hotel accommodation, meals, essential medication, rideshare/transit.
- **Covered Hazards**: Inclement weather, equipment failure/mechanical breakdown, air traffic control (ATC), strike.
- **Ineligible Hazards**: Intentional delay by passenger, schedule changes published prior to departure date.

### Decision Criteria
1. Common carrier ticket purchased with covered card.
2. Delay duration $\ge$ `minimum_delay_threshold_hours`.
3. Verified carrier delay proof (flight number, carrier notice, boarding pass).
