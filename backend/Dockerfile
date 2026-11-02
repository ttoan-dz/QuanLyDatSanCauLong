# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy maven wrapper & pom
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw

# Copy source code and package application
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user and uploads directory for file storage
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

# Copy built JAR from builder stage
COPY --from=builder /app/target/quanlydatsan-api-*.jar app.jar

ENV PORT=8080
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx300m -XX:+UseSerialGC"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

