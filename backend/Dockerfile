# Multi-Stage Build for Spring Boot Backend (Java 21 LTS)
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /build

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Production Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create non-root system user
RUN groupadd -r cbae && useradd -r -g cbae cbae

# Copy executable jar from builder stage
COPY --from=builder /build/target/card-benefits-activation-engine-*.jar /app/app.jar

# Converts a platform DATABASE_URL (postgresql://...) into a JDBC URL, then execs java.
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod 0755 /app/docker-entrypoint.sh

# Memory: Render's free instance is 512 MB for the whole container, so the heap must
# leave room for metaspace, code cache, thread stacks and direct buffers. The old
# -Xmx512m let the heap alone fill the container.
#   MaxRAMPercentage=55     ~280 MB max heap in a 512 MB container (scales with the limit)
#   UseSerialGC             lowest-overhead collector for a small heap on 0.1 CPU
#   MaxMetaspaceSize=160m   caps class metadata
#   ReservedCodeCacheSize   JIT code cache capped at 48 MB (default 240 MB)
#   TieredStopAtLevel=1     C1 only: faster startup, smaller code cache on 0.1 CPU
#   Xss512k                 smaller per-thread stacks
#   ExitOnOutOfMemoryError  fail fast so the platform restarts the instance
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:MaxRAMPercentage=55 -XX:+UseSerialGC -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=48m -XX:TieredStopAtLevel=1 -Xss512k -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

USER cbae

ENTRYPOINT ["/app/docker-entrypoint.sh"]
