# REST API Specification & Contracts

Base URL: `http://localhost:8080/api/v1`

---

## 1. Authentication & Users
- `POST /auth/register` - Create customer account
- `POST /auth/login` - Authenticate customer or admin, return JWT tokens
- `POST /auth/refresh` - Refresh access token using refresh token
- `GET /auth/me` - Retrieve authenticated user profile

---

## 2. Cards & Benefits
- `GET /cards` - List authenticated user's enrolled cards
- `GET /cards/{id}` - Retrieve card details with attached active benefits
- `POST /cards` - Add a new card to user profile

---

## 3. Transactions & Ingestion
- `POST /transactions/ingest` - Ingest raw transaction (Supports `Idempotency-Key` header)
- `GET /transactions` - List transactions for user's cards
- `GET /transactions/{id}` - Get transaction details & evaluation history
- `POST /transactions/simulate` - Trigger deterministic test scenario (Purchase, Return, Travel Delay)

---

## 4. Benefit Opportunities
- `GET /opportunities` - List detected benefit opportunities (filter by status, card)
- `GET /opportunities/{id}` - Retrieve opportunity detail with explainability breakdown & prefill draft
- `POST /opportunities/{id}/dismiss` - Dismiss an opportunity

---

## 5. Claims Management
- `POST /claims` - Submit a prefilled or modified claim (Supports `Idempotency-Key`)
- `GET /claims` - List claims for authenticated customer
- `GET /claims/{id}` - Retrieve claim details and status history
- `POST /claims/{id}/evidence` - Upload evidence document / receipt metadata

---

## 6. Admin & Operations
- `GET /admin/claims` - List all submitted claims across system
- `POST /admin/claims/{id}/review` - Approve or reject claim with adjudication notes
- `GET /admin/analytics` - System-wide benefit utilization and unlocked value metrics

---

## 7. Notifications
- `GET /notifications` - Retrieve customer notifications
- `POST /notifications/{id}/read` - Mark notification as read
- `GET /notifications/stream` - Server-Sent Events (SSE) stream for real-time alerts
