# Technical Architecture & System Design

## 1. Architectural Philosophy
The Card Benefit Activation Engine is architected around **Domain-Driven Design (DDD)**, **Clean Architecture**, and **Event-Driven Micro-components**.

The core mission is real-time extraction of financial protection value for cardholders without burdening them with bureaucratic claim processes.

---

## 2. Core Subsystems

### A. Ingestion & Normalization Layer
Financial transactions arrive from multiple disparate sources:
- Card processor Webhooks / REST APIs
- Distributed Kafka event streams (`transactions.incoming`)
- Deterministic simulation & mock transaction generators

**Transaction Normalizer**:
Converts raw merchant strings, ISO currency strings, timestamp formats, and merchant category codes (MCCs) into a unified domain representation (`NormalizedTransaction`).

### B. Benefit Eligibility Engine
The eligibility engine decouples business protection policy from transaction processing.

```
+----------------------------------------------------------------+
|                        TransactionContext                      |
| (NormalizedTransaction + CardProfile + ActiveBenefits + History)|
+-------------------------------+--------------------------------+
                                |
                                v
+----------------------------------------------------------------+
|                   BenefitRuleRegistry                          |
| Finds applicable rules for card tier & transaction attributes  |
+-------------------------------+--------------------------------+
                                |
                                v
+----------------------------------------------------------------+
|                   Rule Execution Pipeline                      |
| 1. Pre-filter (Status, Currency, Card Active)                  |
| 2. Threshold & Timing Evaluation (Windows, Maximum Limits)     |
| 3. Category & Hazard Check (MCC, Incident Type, Exclusions)    |
| 4. Conflict & Anti-Duplication Check                           |
+-------------------------------+--------------------------------+
                                |
                                v
+----------------------------------------------------------------+
|                    EligibilityDecision                         |
| (isEligible, confidenceScore, reasons[], requiredEvidence[])   |
+----------------------------------------------------------------+
```

### C. Opportunity Registry & Notification Hub
When an eligibility score crosses the confidence threshold:
1. An idempotent `BenefitOpportunity` is generated.
2. Deduplication logic ensures the same transaction does not trigger multiple identical opportunities.
3. Real-time notifications are pushed via Server-Sent Events (`/api/v1/notifications/stream`) and persisted to the database.

### D. Claim Aggregator & Prefill Engine
When a user clicks "Activate & File Claim":
- The prefill engine extracts transaction date, merchant, amount, card tier, claim limit, and generates a pre-filled draft claim.
- The user reviews known facts, uploads any supplementary documentation, and explicitly confirms submission.
- The claim transitions to `SUBMITTED`, publishing a `claim.submitted` event.

---

## 3. Database Architecture & ERD Conceptual Model

```
+---------------+        +---------------+        +-------------------+
|   Customer    | 1    * |     Card      | 1    * |    CardBenefit    |
|---------------|<-------|---------------|<-------|-------------------|
| id (PK)       |        | id (PK)       |        | id (PK)           |
| email         |        | customer_id   |        | card_id           |
| name          |        | card_number_l4|        | benefit_type      |
| password_hash |        | card_network  |        | max_limit_amount  |
| role          |        | card_tier     |        | coverage_days     |
+---------------+        +---------------+        | deductible_amount |
                                                  +-------------------+
                                                            |
                                                            v
+-------------------+    +-----------------------+    +-------------------+
|    Transaction    |    |  BenefitOpportunity   |    |    BenefitRule    |
|-------------------|    |-----------------------|    |-------------------|
| id (PK)           |    | id (PK)               |    | id (PK)           |
| card_id           | 1  | transaction_id (FK)   |    | benefit_type      |
| amount            |<---| benefit_id (FK)       |    | rule_name         |
| currency          |  * | customer_id (FK)      |    | rule_parameters   |
| merchant_name     |    | potential_amount      |    | is_active         |
| mcc_code          |    | confidence_score      |    +-------------------+
| transaction_time  |    | eligibility_reasons   |
| status            |    | status (DETECTED..)   |
+-------------------+    +-----------------------+
                                  |
                                  | 1
                                  |
                                  v *
                         +-----------------------+    +-------------------+
                         |         Claim         | 1* |   ClaimEvidence   |
                         |-----------------------|<---|-------------------|
                         | id (PK)               |    | id (PK)           |
                         | opportunity_id (FK)   |    | claim_id (FK)     |
                         | claim_reference_no    |    | evidence_type     |
                         | claim_amount          |    | file_name         |
                         | status (SUBMITTED..)  |    | file_url          |
                         | incident_date         |    | is_verified       |
                         | submission_notes      |    +-------------------+
                         +-----------------------+
```

---

## 4. Security & Compliance
- **Authentication**: Stateless HMAC SHA-256 JWT tokens with short expiry and secure refresh mechanism.
- **Authorization**: Role-Based Access Control (`ROLE_CUSTOMER`, `ROLE_ADMIN`, `ROLE_OPERATIONS`).
- **Data Protection**: Sensitive payment card numbers are never stored in plain text (only last 4 digits and tokenized card references).
- **Auditability**: Every transaction ingestion, eligibility calculation, opportunity creation, and claim state mutation is recorded in `audit_events`.
