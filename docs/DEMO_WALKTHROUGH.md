# End-to-End Demo Walkthrough Guide

This guide outlines the step-by-step procedure to demonstrate the **Card Benefit Activation Engine** end-to-end.

---

## 🎬 Demo Scenario 1: Purchase Protection (Damaged Laptop)

1. **Login**: Authenticate as `john.doe@example.com` (Enrolled with Platinum Card).
2. **Dashboard Review**: View enrolled card protections. Observe zero active claims.
3. **Transaction Ingestion**:
   - Ingest transaction: \$1,499.00 at "Best Electronics" (MCC 5732).
   - Ingest incident: "Accidental drop & cracked display within 30 days of purchase".
4. **Real-Time Detection**:
   - Engine evaluates transaction against Platinum Card Purchase Protection policy (\$10,000 max coverage, 90-day window).
   - Real-time notification appears: *"Purchase Protection Available: \$1,499 for Best Electronics"*.
5. **Opportunity Inspection**:
   - Open opportunity. Review confidence score (98%) and eligibility reasoning breakdown.
6. **Prefill & Submission**:
   - Click "Activate Protection & Claim".
   - Review pre-filled form (Merchant, Amount, Card, Date, Category).
   - Provide incident details & attach receipt simulation.
   - Click "Submit Claim".
7. **Admin Adjudication & Analytics**:
   - Switch to Admin portal (`admin@example.com`).
   - Open Claims queue, inspect claim evidence, and click "Approve Claim".
   - Value Realized Dashboard updates: Total Protection Value Unlocked increases by \$1,499.00.

---

## 🎬 Demo Scenario 2: Return Protection (Merchant Refused Return)

1. Transaction: \$320 at "Boutique Apparel" (Final sale policy).
2. Customer attempts return after 20 days; merchant denies return due to store policy.
3. System matches Return Protection rule (\$500 max coverage per item within 90 days).
4. Customer activates benefit with single confirmation click.

---

## 🎬 Demo Scenario 3: Travel Delay Insurance (Delayed Flight)

1. Transaction: \$450 flight ticket with "Global Airways" charged to Sapphire Reserve Card.
2. Travel event arrives: Flight delayed 5.5 hours due to mechanical issues.
3. System triggers Travel Delay Insurance opportunity (\$500 reimbursement for meals/lodging).
4. Customer prefill includes flight itinerary, carrier details, and delay duration pre-computed.
