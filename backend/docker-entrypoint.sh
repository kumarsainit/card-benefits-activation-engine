#!/bin/sh
# Container entrypoint.
#
# Render (and most PaaS Postgres offerings) hand out a libpq-style URL:
#     postgresql://user:password@host[:port]/database[?params]
# The PostgreSQL JDBC driver cannot use that form, and Render Blueprints cannot
# build a string from several database properties (no interpolation; Postgres
# only exposes connectionString, user, password and database - not host/port).
#
# So: if DATABASE_URL is set and SPRING_DATASOURCE_URL is not, convert it here to
#     jdbc:postgresql://host[:port]/database[?params]
# Credentials are dropped from the URL; supply them via SPRING_DATASOURCE_USERNAME
# and SPRING_DATASOURCE_PASSWORD (render.yaml maps them from the database).
set -eu

if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*) ;;
    *)
      echo "docker-entrypoint: DATABASE_URL must start with postgres:// or postgresql://" >&2
      exit 1
      ;;
  esac
  without_scheme="${DATABASE_URL#*://}"
  host_and_path="${without_scheme##*@}"   # strip user:password@ (if present)
  SPRING_DATASOURCE_URL="jdbc:postgresql://${host_and_path}"
  export SPRING_DATASOURCE_URL
  echo "docker-entrypoint: SPRING_DATASOURCE_URL derived from DATABASE_URL (host part: ${host_and_path%%/*})"
fi

if [ "${1:-}" = "--print-jdbc-url" ]; then
  # Used by docs/deploy-verification.md to show the conversion without starting the JVM.
  echo "${SPRING_DATASOURCE_URL:-}"
  exit 0
fi

# shellcheck disable=SC2086  # JAVA_OPTS is intentionally word-split
exec java $JAVA_OPTS -jar /app/app.jar "$@"
