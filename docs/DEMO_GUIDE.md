# Card Benefits Activation Engine — Demo Guide & Scenario Walkthrough

## 1. Demo Credentials (Local / Development Mode)

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Cardholder (Customer)** | `customer@example.com` | `Password123!` | Customer Dashboard, Cards Portfolio, Benefits Hub, Transactions, Claim Activation Wizard, Notification Center |
| **Operations Admin** | `admin@cbae.internal` | `AdminSecure2026!` | Operations Overview, Claims Adjudication Queue, Claim Review Workspace, Real-time Analytics Dashboard |

---

## 2. Deterministic Scenario Walkthrough

Navigate to `/demo` or use the **Scenario Simulator Drawer** on the Customer Dashboard (`/dashboard`).

### Scenario A — Purchase Protection ($1,499.00 Best Buy Electronics)
1. **Trigger**: Click **Scenario A: Purchase Protection** on `/demo`.
2. **Engine Action**: Ingests \$1,499.00 electronics purchase (MCC 5732) under active Amex Platinum policy.
3. **Detection**: Engine matches the 90-day coverage window and retail electronics MCC, outputting a 98% rule match confidence.
4. **Cardholder Flow**:
   - Opens `/opportunities/[id]` to review explainability reasons.
   - Launches **Activate Benefit & Start Claim**.
   - Reviews pre-filled transaction facts (Zero Re-Entry).
   - Describes incident (*"Laptop screen cracked after drop"*), attaches receipt document, confirms cardholder declaration, and clicks **Submit Claim**.
5. **Admin Flow**:
   - Sign in as Admin (`admin@cbae.internal`).
   - Open `/admin/claims`, find the newly submitted claim, review attached receipt, and click **Approve Claim Payout**.
6. **Outcome**: Claim transitions to `APPROVED`, payout of \$1,499.00 authorized, and real-time SSE notification dispatched to cardholder.

---

### Scenario B — Return Protection ($280.00 Zara Apparel)
1. **Trigger**: Click **Scenario B: Return Protection** on `/demo`.
2. **Engine Action**: Ingests \$280.00 retail store swipe (MCC 5651) with active Return Protection coverage.
3. **Cardholder Flow**: Pre-fills \$280.00 claim with 45-day coverage window, notes merchant refusal, and submits.
4. **Admin Flow**: Adjudicates in `/admin/claims/[id]`, authorizes reimbursement.

---

### Scenario C — Travel Delay Insurance (Delta Air Lines 7-Hour Flight Delay)
1. **Trigger**: Click **Scenario C: Travel Delay Insurance** on `/demo`.
2. **Engine Action**: Ingests airline transaction with travel metadata indicating a 7-hour flight delay ($\ge 6$ hr minimum threshold).
3. **Outcome**: Automatically calculates eligible reimbursement limit (\$500.00 policy cap), allowing immediate claim prefill.

---

### Scenario D — Excluded Ineligible Category (Negative Policy Verification)
1. **Trigger**: Click **Scenario D: Excluded Ineligible Transaction** on `/demo`.
2. **Engine Action**: Ingests \$450.00 automotive service transaction (MCC 7538).
3. **Outcome**: Engine evaluates policy exclusions and produces **0 qualifying opportunities**, confirming that false positives are prevented.
