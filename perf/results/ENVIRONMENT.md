# Measurement environment

Raw capture: [`raw/phase0_environment.txt`](raw/phase0_environment.txt) (captured 2026-11-16 14:44 UTC).

| Item | Value |
|---|---|
| Machine | MacBook Pro (MacBookPro18,1) |
| Chip | Apple M1 Pro, 10 cores (8 performance + 2 efficiency) |
| RAM | 16 GB |
| OS | macOS 27.2 (build 26B123) |
| JDK | Oracle Java SE 21.0.7+8-LTS (Maven run with `JAVA_HOME=$(/usr/libexec/java_home -v 21)`; Maven's own default JDK on this machine is Homebrew OpenJDK 25, which was **not** used) |
| Maven | 3.9.16 |
| Node / npm | v25.5.0 / 11.8.0 |
| k6 | v2.4.0 |
| Docker | Docker Desktop, engine 29.8.0, Compose v5.5.1 |
| Docker VM allocation (from `docker info`) | 10 CPUs, 7.748 GiB memory (Docker Desktop defaults, unchanged) |
| Per-container limits | none (`NanoCpus=0`, `Memory=0` for postgres, kafka, redis) |
| Containers | postgres:16-alpine (PostgreSQL 16.15), apache/kafka:3.7.0 (KRaft, 1 broker, 3 partitions), redis:7.2-alpine |
| Starting commit | `58a4a76` on `feature/production-deployment`, branched to `perf/measured-metrics` |

## How the backend was run

- `backend/target/card-benefits-activation-engine-1.0.0-SNAPSHOT.jar` started by `perf/scripts/backend.sh`, default JVM
  heap settings (no `-Xmx`), Spring profile `dev` (the default), logging as configured in `application.yml`
  (`com.cbae.engine: DEBUG`, console output redirected to a file).
- Database: an **isolated** database `card_benefits_perf` in the same Postgres container, created only for these
  measurements and migrated by Flyway V1–V3 (+ any perf migrations). `perf/scripts/reset-db.sh` truncates
  generated rows before every measured run and refuses to run against any other database.
- `app.kafka.enabled` is unset (defaults to `false`) for REST measurements, so the Kafka consumer is not running in
  Phases 2–4 and 6. Phase 5 uses its own Kafka (see that section).
- Actuator `metrics` endpoint exposed only via command-line flag during perf runs
  (`--management.endpoints.web.exposure.include=health,info,metrics`); committed config still exposes `health,info` only.
- Health check: `GET /actuator/health` → `{"status":"UP"}` ([`raw/phase0_health.json`](raw/phase0_health.json)).

## Shared-machine caveat

The load generator (k6), the Spring Boot JVM, and all Docker containers (Postgres, Kafka, Redis) run on the **same
laptop** and compete for the same 10 cores and memory. Measured latency includes this contention and throughput
numbers are a ceiling for this exact setup, not for a deployed service.

## Fix required to complete Phase 0

`/actuator/health` returned HTTP 500 at the starting commit: `spring-boot-starter-actuator` was not a dependency, even
though `application.yml`, `SecurityConfig` and `render.yaml` (`healthCheckPath: /actuator/health`) all assume it.
The resulting `NoResourceFoundException` was turned into a 500 by `GlobalExceptionHandler`. Fixed by adding the
dependency to `backend/pom.xml` (commit in the Phase 0 commit).
