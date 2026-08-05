# Stage 1: Frontend build
FROM node:24-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend build
FROM rust:1-slim AS backend-builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src/ src/
COPY --from=frontend-builder ../static ./static

RUN cargo build --release --bin rocket-auth-server --bin create-user

# Stage 3: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/target/release/rocket-auth-server ./
COPY --from=backend-builder /app/target/release/create-user ./
COPY --from=backend-builder /app/static ./static

ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["./rocket-auth-server"]
