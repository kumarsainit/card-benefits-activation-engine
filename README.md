# Card Benefit Activation Engine (CBAE)

> **Unlocking the True Value of Built-In Card Protection Benefits**

The **Card Benefit Activation Engine** is a high-performance, event-driven fintech platform that continuously evaluates cardholder transactions against built-in credit and debit card insurance protections. It automatically detects covered events (Purchase Protection, Return Protection, Travel Delay Insurance), calculates eligibility with high confidence, surfaces proactive notifications, and pre-populates claim documentation so cardholders can activate their benefits in seconds.

---

## 🚀 Key Features

1. **Intelligent Benefit Detection**: Real-time evaluation of transaction records against card tier protections.
2. **Three Core Initial Protection Engines**:
   - **Purchase Protection**: Covers theft or accidental damage of eligible items within coverage windows (up to \$10,000/incident).
   - **Return Protection**: Reimburses purchases when a merchant refuses an item return within 60–90 days (up to \$300–\$500/item).
   - **Travel Delay Insurance**: Automatically flags common carrier delays exceeding 4–6 hours to cover lodging, dining, and transit expenses (up to \$500).
3. **Configurable Rule Pipeline**: Modular specification pattern avoiding hardcoded if/else trees.
4. **Zero-Friction Claim Prefill**: Aggregates verified transaction data, merchant details, receipt indicators, and card policies into pre-filled claim drafts.
5. **Customer-in-Control**: Adheres strictly to **DETECT → EXPLAIN → PRE-FILL → CONFIRM → SUBMIT**.
6. **Dual Ingestion**: Real-time Kafka event streaming + REST API fallback + Deterministic demo transaction generator.
7. **Enterprise Security & Auditability**: Stateless JWT auth, role-based access control, comprehensive immutable audit logging.

---

## 🏗️ Architecture Overview

```
                     +---------------------------------------+
                     |         Frontend (Next.js 15)         |
                     |  React, Tailwind CSS, shadcn/ui,      |
                     |  TanStack Query, TypeScript           |
                     +-------------------+-------------------+
                                         |
                                (REST & Server-Sent Events)
                                         |
                                         v
                     +---------------------------------------+
                     |        API Gateway / Security         |
                     |     Spring Security + JWT Auth        |
                     +-------------------+-------------------+
                                         |
            +----------------------------+---------------------------+
            |                                                        |
            v                                                        v
+-----------------------+                                +-----------------------+
|  Transaction Ingestion|                                |   Claim Management    |
| - REST API Endpoint   |                                | - Claim Lifecycle     |
| - Kafka Event Ingest  |                                | - Evidence Store      |
| - Mock Sim Generator  |                                | - Prefill Aggregator  |
+-----------+-----------+                                +-----------+-----------+
            |                                                        |
     (Transaction)                                                   |
            v                                                        |
+-----------------------+                                            |
| Transaction Normalizer|                                            |
| - ISO / Merchant / Cat|                                            |
| - Currency / Date / Id|                                            |
+-----------+-----------+                                            |
            |                                                        |
            v                                                        |
+----------------------------------------------------+               |
|            Benefit Eligibility Engine              |               |
|  - Strategy & Composite Rule Evaluator             |               |
|  - Purchase Protection Rule (Amount, Window, Cat)  |               |
|  - Return Protection Rule (Window, Policy, Limit)  |               |
|  - Travel Delay Rule (Delay Duration, Common Carrier)|            |
|  - Confidence Scorer & Explainability Generator    |               |
|  - Evidence Requirement Analyzer                   |               |
+-------------------------+--------------------------+               |
                          |                                          |
               (Opportunity Identified)                              |
                          v                                          |
+----------------------------------------------------+               |
|       Benefit Opportunity & Notification Core      |---------------+
|  - Opportunity Registry (Deduplication / Expiry)  |
|  - Notification Dispatcher (In-app, Real-time SSE) |
|  - Prefill Data Preparation (Zero Data Re-entry)   |
+-------------------------+--------------------------+
                          |
            +-------------+-------------+
            |                           |
            v                           v
+-----------------------+   +-----------------------+
|  PostgreSQL Database  |   |     Apache Kafka      |
| - Cards & Benefits    |   | - transactions.incoming|
| - Transactions        |   | - claims.events       |
| - Opportunities/Claims|   | - notifications.events|
| - Audit Logs          |   +-----------------------+
+-----------------------+
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Lucide React.
- **Backend**: Java 21 LTS, Spring Boot 3.3.x, Spring Data JPA, Spring Security, Spring Kafka, Bean Validation, Flyway.
- **Database**: PostgreSQL 16.
- **Message Broker & Caching**: Apache Kafka (KRaft), Redis 7.
- **Testing**: JUnit 5, Mockito, AssertJ, Vitest, React Testing Library.
- **Infrastructure**: Docker & Docker Compose.

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- Java 21 LTS (`JAVA_HOME` pointing to JDK 21)
- Node.js 20+ / 25
- Docker & Docker Compose
- Maven 3.9+

### 2. Start Local Infrastructure
```bash
# Spin up PostgreSQL, Kafka, and Redis
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`. API documentation available at `http://localhost:8080/swagger-ui.html`.

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## 🧪 Running Tests
```bash
# Backend unit & integration tests
cd backend && mvn test

# Frontend unit & component tests
cd frontend && npm test
```

---

## 📜 Documentation
- [Architecture & Design Details](docs/ARCHITECTURE.md)
- [Benefit Rules Specification](docs/BENEFIT_RULES.md)
- [API Documentation & Contracts](docs/API.md)
- [Deterministic Demo Guide](docs/DEMO_WALKTHROUGH.md)
