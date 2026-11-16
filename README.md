# Card Benefits Activation Engine (CBAE)

> **Autonomous Value Realization for Built-In Credit Card Insurance Protections**

**🌐 Live demo: <https://cbae-frontend.onrender.com>** · [API](https://cbae-backend.onrender.com/api/v1) · [Health](https://cbae-backend.onrender.com/actuator/health) · [Demo logins](#demo-credentials-pre-seeded)

The **Card Benefits Activation Engine (CBAE)** is an event-driven fintech platform that monitors credit card transactions, automatically evaluates eligibility for built-in card protections (Purchase Protection, Return Protection, and Travel Delay Insurance), surfaces explainable opportunities in real-time, and streamlines prefilled claim filing and adjudication.

---

## 🌐 Live demo

Hosted on Render's free plan:

- **Frontend:** <https://cbae-frontend.onrender.com>
- **Backend API:** <https://cbae-backend.onrender.com/api/v1>
- **Health check:** <https://cbae-backend.onrender.com/actuator/health>
- **Swagger UI:** <https://cbae-backend.onrender.com/swagger-ui.html>

Sign in with the [demo credentials](#demo-credentials-pre-seeded) below.

> **Free-plan behaviour:** the services sleep after 15 minutes without traffic, so the first
> request after a quiet period can take a minute or more. The free database expires 30 days
> after creation (this one was created on 17 Nov 2026), so the demo may go offline around
> mid-December 2026 unless it is recreated. See [Free-plan limits](#️-deploy-to-render).

---

## ▶️ Run locally

To run the whole stack on your own machine with Docker:

```bash
docker compose up --build
```

The first build takes a few minutes. When the backend logs `Started CardBenefitsActivationEngineApplication`:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8080/api/v1> (health: <http://localhost:8080/actuator/health>)
- Swagger UI: <http://localhost:8080/swagger-ui.html>

The backend runs with the same `prod` profile and database-URL handling as the Render deployment.
Compose also starts Kafka and Redis for local pipeline work; the app does not need them
(`APP_KAFKA_ENABLED=false`).

### Demo Credentials (Pre-seeded)
| Persona | Email | Password | Role / Scope |
| :--- | :--- | :--- | :--- |
| **Cardholder (Customer)** | `customer@example.com` | `Password123!` | Dashboard, Benefits, Claim Activation Wizard, SSE Alerts |
| **Operations Admin** | `admin@cbae.internal` | `AdminSecure2026!` | Claims Adjudication Queue, Decisions, Value Analytics |

These accounts are created by the Flyway seed migrations on first start.

---

## ☁️ Deploy to Render

The repo includes a Render Blueprint ([`render.yaml`](render.yaml)) that creates three resources on
Render's free plan: `cbae-postgres` (PostgreSQL), `cbae-backend` (Docker web service) and
`cbae-frontend` (Node web service).

1. Fork or push this repository to your GitHub/GitLab account.
2. In the Render Dashboard choose **New → Blueprint**, connect the repository, and select the
   branch. Render reads `render.yaml` from the repo root.
3. Review the three resources and click **Deploy Blueprint**. The backend generates its own
   `JWT_SECRET`; there are no secrets to enter.
4. Wait for `cbae-backend` to show **Live** (its health check is `/actuator/health`; on the
   free 0.1 CPU instance, startup takes a few minutes).
5. **Check the public URLs.** The blueprint assumes Render gives the services the subdomains
   `https://cbae-backend.onrender.com` and `https://cbae-frontend.onrender.com`. If the service
   page shows a different `onrender.com` URL:
   - on `cbae-frontend`, set `NEXT_PUBLIC_API_BASE_URL` to `https://<backend-url>/api/v1`, then
     **Manual Deploy → Clear build cache & deploy** (the value is baked in at build time);
   - on `cbae-backend`, set `CORS_ALLOWED_ORIGINS` to `https://<frontend-url>` (no trailing slash).

   Update `render.yaml` to match, or a later Blueprint sync will reset them.
6. Open the frontend URL and sign in with a demo account above.

How the configuration works:

- **Database URL.** Render Postgres exposes a `postgresql://user:password@host/db` connection
  string, which the JDBC driver does not accept, and Blueprints cannot build strings from parts.
  The blueprint passes it as `DATABASE_URL`, and
  [`backend/docker-entrypoint.sh`](backend/docker-entrypoint.sh) converts it to
  `jdbc:postgresql://host/db` at startup. User and password come from the database as
  `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`.
- **Frontend API URL.** `NEXT_PUBLIC_API_BASE_URL` is inlined into the browser bundle at build
  time, so it is the backend's public `https://…onrender.com/api/v1` URL.
- **Memory.** Free instances have 512 MB. The backend image caps the JVM heap at 55% of the
  container limit and uses SerialGC.

**Free-plan limits:**

- **The free PostgreSQL database expires 30 days after it is created.** Render then gives a
  14-day grace period to upgrade before the database and its data are deleted. To keep using the
  free plan after that, delete the database and re-sync the Blueprint (the schema and demo data
  are recreated by Flyway on the next backend start).
- **Free web services sleep after 15 minutes without traffic.** The next request wakes them,
  which takes about a minute for the frontend; the backend then needs its own startup time on
  0.1 CPU (about 2.5 minutes in local testing with a 0.1 CPU limit), so the first sign-in after
  idle can be slow or time out once.

See [`docs/deploy-verification.md`](docs/deploy-verification.md) for what has been verified
locally, and what has not.

---

## 🌟 Key Capabilities

1. **Intelligent Real-Time Benefit Engine**: Evaluates card swipes against configurable policy parameters (MCC categories, swipe amounts, coverage windows, common carrier delay thresholds).
2. **Three Core Built-In Protections**:
   - **Purchase Protection**: Covers theft and accidental damage within 90 days of purchase (up to \$10,000/claim).
   - **Return Protection**: Reimburses purchases when a retail merchant refuses an item return within 45 days (up to \$300/item).
   - **Travel Delay Insurance**: Automatically flags common carrier delays $\ge 6$ hours to cover lodging, meals, and emergency transit expenses (up to \$500/incident).
3. **Zero Re-Entry Claim Prefill**: Aggregates authoritative transaction records, card details, merchant names, and policy terms directly into claim drafts.
4. **Operations Adjudication Portal**: Comprehensive admin claims queue, evidence review console, state-machine-backed determination controls (Approve, Partial, Request Info, Reject), and value realization analytics.
5. **Real-Time Notification Stream**: Server-Sent Events (SSE) notification streaming updating the client application without page reloads.
6. **Deterministic Demo Runner**: Interactive one-click demo console (`/demo`) executing end-to-end positive and negative test scenarios.

---

## 🏛️ Application Routes Catalog

### Public & Authentication
- `/` — Landing page with benefit pillars, interactive demos, and product walkthrough
- `/login` — Sign in with instant demo account presets
- `/register` — Customer account registration

### Customer Portal
- `/dashboard` — Value realization hero metrics, active opportunities feed, recent transactions, and quick scenario simulator drawer
- `/benefits` & `/opportunities` — Enrolled card protection policies hub and filterable opportunities feed
- `/opportunities/[id]` — Opportunity detail with explainability checklist and *"Activate Benefit & Start Claim"* modal
- `/cards` & `/cards/[id]` — Enrolled virtual glass cards portfolio and policy coverage breakdown
- `/transactions` & `/transactions/[id]` — Transaction search table and transaction detail description list
- `/claims` & `/claims/[id]` — Active filed claims list, lifecycle tracking timeline, and supplementary evidence uploader
- `/notifications` — Real-time notification center with tabbed filtering (`All`, `Unread`, `Benefits`, `Claims`)
- `/demo` — Deterministic 4-scenario end-to-end execution runner

### Operations & Admin Portal (`ROLE_ADMIN`)
- `/admin` — Operations summary dashboard with active queue counts, approved payout volume, and priority review preview
- `/admin/claims` — Searchable and filterable claims adjudication queue
- `/admin/claims/[id]` — Claim detail workspace with customer statements, evidence inspection, and determination modals
- `/admin/analytics` — Value realization analytics, benefit activation funnel, and protection domain breakdown

---

## 🏗️ Architecture & Technology Stack

```mermaid
flowchart TB
    subgraph Frontend["Next.js 14 App Router"]
        CustomerUI["Customer Portal (/dashboard, /cards, /claims)"]
        Wizard["Claim Activation Wizard (React Hook Form + Zod)"]
        AdminUI["Admin Adjudication & Analytics (/admin/*)"]
        SSEStreamClient["SSE Real-time Listener (EventSource)"]
    end

    subgraph Backend["Spring Boot 3.3 Engine (Java 21 LTS)"]
        Security["Spring Security (Stateless JWT + RBAC)"]
        Ingestion["Transaction Ingestion & Normalizer"]
        RuleEngine["Configurable Benefit Eligibility Engine"]
        ClaimService["Claim Prefill & Lifecycle Service"]
        AdminService["Operations Claim Review Service"]
        SSEController["Server-Sent Events Controller"]
    end

    subgraph Persistence["Persistence & Event Streaming"]
        Postgres[("PostgreSQL 16 (Flyway Migrations)")]
        Kafka[("Apache Kafka Event Bus")]
        Redis[("Redis 7 Cache")]
    end

    Frontend --> Security
    Security --> Ingestion
    Ingestion --> Kafka
    Kafka --> RuleEngine
    RuleEngine --> Postgres
    RuleEngine --> SSEController
    SSEController --> SSEStreamClient
    Wizard --> ClaimService
    ClaimService --> Postgres
    AdminUI --> AdminService
    AdminService --> Postgres
```

---

## ⚡ Local Development (hot reload)

To work on the code instead of running the containers from [Run locally](#️-run-locally),
start only the infrastructure in Docker and run the apps on the host.

### 1. Prerequisites
- **Java 21 LTS** (`JAVA_HOME` pointing to JDK 21)
- **Node.js 22** (20+ works)
- **Docker & Docker Compose**
- **Maven 3.9+**

### 2. Start Infrastructure
```bash
docker compose up -d postgres kafka redis
```

### 3. Start Backend
```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`. Swagger UI at `http://localhost:8080/swagger-ui.html`.*

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Running Test Suites

```bash
# Frontend Unit & Component Tests (Vitest)
cd frontend && npm test

# Frontend Lint & Typecheck
cd frontend && npm run lint && npm run typecheck

# Frontend Production Build
cd frontend && npm run build

# Backend Test Suite (JUnit 5 / Java 21)
cd backend && mvn clean test
```

---

## 📚 Documentation
- [Detailed System Architecture](docs/ARCHITECTURE.md)
- [Deterministic Demo Walkthrough & Credentials](docs/DEMO_GUIDE.md)
- [Security Specifications & Hardening](docs/SECURITY.md)
- [Design System & UI Tokens](docs/DESIGN_SYSTEM.md)
