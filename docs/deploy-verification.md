# Render deployment: local verification

Date: 2026-11-17 · Branch: `fix/render-deploy` · Machine: macOS (Apple Silicon), Docker 29.8.0

**Scope.** Everything here ran on a local machine. Nothing was deployed to Render, and nothing in
this file shows that the Render deployment works. It shows that the pieces the Blueprint
relies on (image, entrypoint, env wiring, memory, frontend build/start) work when given the
same inputs Render documents. See [Not verified](#not-verified-needs-render) at the end.

All verification ran against a throwaway Postgres container (`cbae-verify-pg`, own Docker
network, generated password) and a separately named Compose project. The developer database
was not used. Passwords are redacted in the outputs below.

---

## 0. What was wrong (pre-fix findings)

| # | Problem in `main` | Evidence |
|---|---|---|
| 1 | `SPRING_DATASOURCE_URL` got the database `connectionString` (`postgresql://user:pass@host/db`). There was no `application-prod.yml`, so nothing converted it. | §2 "before" run: `Driver org.postgresql.Driver claims to not accept jdbcUrl` |
| 1b | Render Postgres `fromDatabase` exposes only `connectionString`, `connectionPoolString`, `user`, `password`, `database` (no `host`/`port`), and Blueprints do not support interpolation, so a JDBC URL cannot be assembled in `render.yaml`. | Render Blueprint spec, "Supported properties" and "Variable interpolation" |
| 2 | `NEXT_PUBLIC_API_BASE_URL` used `fromService … property: host`. Per the spec, `host` is "the service's hostname on the private network", which is unusable from a browser. A `value` key inside `fromService` does not appear in any spec example. | Render Blueprint spec |
| 3 | Backend `JAVA_OPTS="-Xms256m -Xmx512m"` in a 512 MB free instance: the heap alone could use the whole container. | `backend/Dockerfile` |
| 4 | Frontend blueprint set `NODE_ENV=production` as an env var. Blueprint env vars are present at build time, so `npm install` skips devDependencies, `typescript` is missing, and `next build` fails. | §4 A/B build |
| 5 | Top-level `version: "1"` is not a documented root field. | Spec root fields: `services`, `databases`, `envVarGroups`, `projects`, `ungrouped`, `previews` |
| 6 | `frontend/Dockerfile` copied `/app/public`, which does not exist, so the image never built. | §6 first compose run: `"/app/public": not found` |

## 1. Backend image build

```
$ docker build -t cbae-backend:render-verify backend
...
real    3m21.672s
exit=0
```

## 2. DATABASE_URL to JDBC conversion

### 2a. Before: old wiring (connection string passed straight to `SPRING_DATASOURCE_URL`)

```
$ docker run --rm --network cbae-verify-net --memory=512m --memory-swap=512m \
    -e SPRING_PROFILES_ACTIVE=prod \
    -e SPRING_DATASOURCE_URL="postgresql://card_user:<redacted>@cbae-verify-pg/card_benefits_db" \
    -e SPRING_DATASOURCE_USERNAME=card_user -e SPRING_DATASOURCE_PASSWORD=<redacted> \
    -e APP_KAFKA_ENABLED=false -e PORT=10000 cbae-backend:render-verify
container exit=1
Driver org.postgresql.Driver claims to not accept jdbcUrl, postgresql://card_user:<redacted>@cbae-verify-pg/card_benefits_db
```

### 2b. Entrypoint conversion cases (`backend/docker-entrypoint.sh --print-jdbc-url`)

```
postgresql://card_user:s3cr3t@dpg-abc123-a/card_benefits_db            -> jdbc:postgresql://dpg-abc123-a/card_benefits_db
postgresql://card_user:s3cr3t@dpg-abc123-a:5432/card_benefits_db       -> jdbc:postgresql://dpg-abc123-a:5432/card_benefits_db
postgres://card_user:s3cr3t@dpg-abc123-a.oregon-postgres.render.com/card_benefits_db?sslmode=require
                                                                        -> jdbc:postgresql://dpg-abc123-a.oregon-postgres.render.com/card_benefits_db?sslmode=require
postgresql://dpg-abc123-a/card_benefits_db                              -> jdbc:postgresql://dpg-abc123-a/card_benefits_db
SPRING_DATASOURCE_URL already set                                      -> left unchanged (jdbc:postgresql://other/db)
mysql://u:p@h/d                                                        -> "DATABASE_URL must start with postgres:// or postgresql://", exit 1
```

The log line prints only the host part, never the credentials.

## 3. Backend: prod profile, 512 MB, 0.1 CPU, Render-style env

Env mirrors `render.yaml`: `DATABASE_URL` in Render's internal-URL shape (no port),
user and password as separate vars, a `JWT_SECRET` in the same shape as `generateValue`
(base64 of 256 random bits), and `PORT=10000` (Render's documented default).
CPU limited to 0.1 to match the free instance.

```
$ docker run -d --name cbae-verify-be --network cbae-verify-net -p 18080:10000 \
    --memory=512m --memory-swap=512m --cpus=0.1 \
    -e SPRING_PROFILES_ACTIVE=prod \
    -e DATABASE_URL="postgresql://card_user:<redacted>@cbae-verify-pg/card_benefits_db" \
    -e SPRING_DATASOURCE_USERNAME=card_user -e SPRING_DATASOURCE_PASSWORD=<redacted> \
    -e CORS_ALLOWED_ORIGINS=http://localhost:13000 \
    -e JWT_SECRET="$(openssl rand -base64 32)" \
    -e JWT_EXPIRATION_MS=86400000 -e JWT_REFRESH_EXPIRATION_MS=604800000 \
    -e APP_KAFKA_ENABLED=false -e PORT=10000 cbae-backend:render-verify

startup wall seconds: 158
running=true oom=false exit=0
docker-entrypoint: SPRING_DATASOURCE_URL derived from DATABASE_URL (host part: cbae-verify-pg)
... The following 1 profile is active: "prod"
... Successfully applied 4 migrations to schema "public"
... Tomcat started on port 10000 (http) with context path '/'
... Started CardBenefitsActivationEngineApplication in 144.091 seconds
```

### Health, demo login, auth, CORS

```
GET  /actuator/health                          -> {"status":"UP"}  [HTTP 200]
POST /api/v1/auth/login  customer@example.com  -> 200, success=True user=customer@example.com ROLE_CUSTOMER, token length 279
GET  /api/v1/cards  with Bearer token          -> 200
GET  /api/v1/cards  without token              -> 401
POST /api/v1/auth/login  admin@cbae.internal   -> 200
POST /api/v1/auth/login  wrong password        -> 401
OPTIONS /api/v1/auth/login  Origin: http://localhost:13000 -> 200, Access-Control-Allow-Origin: http://localhost:13000
OPTIONS /api/v1/auth/login  Origin: https://evil.example   -> 403
```

### Memory

JVM flags (in `backend/Dockerfile`): `-XX:MaxRAMPercentage=55 -XX:+UseSerialGC
-XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=48m -XX:TieredStopAtLevel=1 -Xss512k
-XX:+ExitOnOutOfMemoryError`.

```
MaxHeapSize = 295698432   (~282 MiB at a 512 MiB limit)
idle after startup:  246.7MiB / 512MiB (48.18%)
```

Burst (script: 5 endpoint checks, then 300×4 authenticated GETs at concurrency 10, then 20
BCrypt logins at concurrency 5; `docker stats` sampled throughout):

```
GET /api/v1/{cards,transactions,opportunities,claims,notifications} -> 200 each
burst status codes: 1220 × 200
memory samples: 94, peak: 270.4 MiB / 512 MiB
running=true oomKilled=false restarts=0
```

This is a short local burst, not a load test or a capacity claim.

## 4. Frontend: Render build and start commands (Node 22, clean copy, no host node_modules)

### 4a. A/B: the `NODE_ENV=production` build bug

```
# Old blueprint env (NODE_ENV=production present at build time)
$ docker run --rm -v <copy>/frontend:/app -w /app -e NODE_ENV=production \
    -e NEXT_PUBLIC_API_BASE_URL=https://cbae-backend.onrender.com/api/v1 node:22-alpine \
    sh -c 'npm install && npm run build'
v22.23.5
Module not found: Can't resolve '@/components/ui/badge'
Module not found: Can't resolve '@/features/admin/use-admin-analytics'
> Build failed because of webpack errors

# New blueprint env (no NODE_ENV), same command otherwise
...
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### 4b. Public-style API URL is inlined; `npm start` honours `$PORT`

```
files in .next/static containing https://cbae-backend.onrender.com/api/v1: 3
routes-manifest rewrite destination: https://cbae-backend.onrender.com/api/v1/:path*

$ docker run -p 13001:10000 -e NODE_ENV=production -e PORT=10000 node:22-alpine npm start
  - Local:        http://localhost:10000
 ✓ Ready in 450ms
GET /login -> 200
GET /      -> 200
```

### 4c. Production build against the local backend (§3)

Built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:18080/api/v1`, started with
`PORT=10000` and published on `localhost:13000` (the origin allowed by the backend's CORS).

```
.next/BUILD_ID present (build succeeded)
GET http://localhost:13000/login -> 200
login page chunks containing http://localhost:18080/api/v1:
  /_next/static/chunks/5086-913dbb3424c1a48b.js
  /_next/static/chunks/app/layout-2d28002746360155.js
browser-equivalent preflight  (Origin: http://localhost:13000) -> 200
  Access-Control-Allow-Origin: http://localhost:13000
  Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
  Access-Control-Allow-Headers: content-type
  Access-Control-Allow-Credentials: true
browser-equivalent POST /auth/login (Origin: http://localhost:13000) -> 200
  Access-Control-Allow-Origin: http://localhost:13000
  success=True | user=customer@example.com | has accessToken: True
```

No real browser was driven: the Chrome extension was not connected and no Playwright browser
was installed. The cross-origin requests above are the ones the built page sends, replayed
with curl.

## 5. Blueprint validation

The Render CLI (v2.36.0, Homebrew `render`) was installed, but validation needs a logged-in
workspace:

```
$ render blueprints validate render.yaml
Error: no workspace specified and no default workspace set. Use --workspace or run 'render workspace set'
```

So `render.yaml` was checked field by field against https://render.com/docs/blueprint-spec
(fetched 2026-11-17):

| Field used | Spec says | OK |
|---|---|---|
| root `databases`, `services` (no `version`) | documented root fields | ✓ |
| `databases[].name`, `databaseName`, `user`, `region: oregon`, `plan: free` | all documented; `free` is a database plan | ✓ |
| `databases[].ipAllowList: []` | "To block all external connections, set `ipAllowList` to an empty list" | ✓ |
| `services[].type: web`, `name`, `runtime: docker` / `node` | documented | ✓ |
| `plan: free`, `region: oregon` | "compute plan, such as free" | ✓ |
| `dockerContext: ./backend`, `dockerfilePath: ./backend/Dockerfile` | both "relative to the repo root" | ✓ |
| `healthCheckPath: /actuator/health` | web services only, starts with `/` | ✓ |
| `rootDir: frontend`, `buildCommand`, `startCommand` | documented | ✓ |
| `envVars[].key` + `value` | documented | ✓ |
| `envVars[].generateValue: true` | "randomized, base64-encoded, 256-bit value" | ✓ |
| `fromDatabase` `property: connectionString` / `user` / `password` | listed as Render Postgres properties | ✓ |
| `NODE_VERSION` env var | Render node-version docs: highest-precedence way to pin Node | ✓ |

Also run: `docker compose config --quiet` exits 0 for the updated `docker-compose.yml`.

## 6. `docker compose up` (README "Run locally")

Run as an isolated copy (container names removed, host ports +20000, project
`cbae-verify-compose`) so it could not collide with the developer stack. Services: postgres,
backend, frontend.

First run failed on a pre-existing bug in `frontend/Dockerfile`:

```
ERROR: failed to calculate checksum ...: "/app/public": not found
```

After the fix (`mkdir -p public` before `npm run build`):

```
up exit=0
GET  :28080/actuator/health        -> {"status":"UP"}  [HTTP 200]
GET  :23000/login                  -> 200
POST :28080/api/v1/auth/login customer -> 200
POST :28080/api/v1/auth/login admin    -> 200
services: backend running, frontend running, postgres running
docker-entrypoint: SPRING_DATASOURCE_URL derived from DATABASE_URL (host part: postgres:5432)
```

## 7. Backend test suite (unchanged code; added `application-prod.yml`)

```
$ docker run --rm -v <copy>/backend:/build -w /build maven:3.9.8-eclipse-temurin-21 mvn -q -B test
mvn test exit=0
surefire: tests=55 failures=0 errors=0 skipped=0
```

---

## Render deployment: confirmed (17 Nov 2026)

After the local checks above, the Blueprint was deployed from `main` at commit `b09ec9b`:

- Render accepted the Blueprint and created `cbae-postgres`, `cbae-backend` and `cbae-frontend`.
- Both web services reached **Live** on the first deploy (backend 3 min 28 s, frontend 2 min 30 s,
  as shown on each service's Deploys page).
- The services were assigned exactly `https://cbae-backend.onrender.com` and
  `https://cbae-frontend.onrender.com`, so no URL changes were needed.
- The repository owner then checked the backend health endpoint and signed in through the
  frontend; both worked.

This resolves these items from the list below: Blueprint acceptance, the service subdomains,
the shape of Render's `connectionString` (the backend started and connected), startup within
Render's deploy window, and Render's Docker and Node builds. Memory behaviour on the real
instance, spin-down and wake-up timing, and the Postgres expiry date were not measured or
observed here.

## Not verified (still open after the Render deploy)

- That Render accepts the Blueprint (`render blueprints validate` needs a logged-in workspace).
- That the services get the subdomains `cbae-backend.onrender.com` / `cbae-frontend.onrender.com`.
  If not, `NEXT_PUBLIC_API_BASE_URL` and `CORS_ALLOWED_ORIGINS` must be changed (README step 5).
- The exact shape of Render's internal `connectionString` (with or without `:port`); both are
  handled (§2b).
- That the backend becomes healthy within Render's deploy health-check window on the real
  0.1 CPU instance (locally: 144 s to start at `--cpus=0.1`).
- Real free-instance memory behaviour (locally: peak 270 MiB of 512 MiB in a short burst).
- Render's Docker build (BuildKit version, build time limits) and Node 22 resolution from
  `NODE_VERSION=22`.
- Spin-down and wake-up behaviour, and the 30-day Postgres expiry (taken from Render's docs:
  https://render.com/docs/free).
