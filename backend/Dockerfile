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

# Configuration environment defaults
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

EXPOSE 8080

USER cbae

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
