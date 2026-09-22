# Centralized Observability Implementation Plan

This guide explains what runs inside each Vendor Backend service and what runs in the central observability environment.

The goal is one place to investigate errors, HTTP requests, traces, and metrics across all services. Each service creates telemetry locally. Central infrastructure stores and displays it.

## 1. Final Architecture

```text
Client
  |
  v
API Gateway
  |
  +--> Identity Service
  +--> Vendor Service
  +--> Vendor Admin Service
  +--> Subscription Service
  +--> Payment Service
  +--> Notification Service
  +--> Activity Service

Every Node.js service:
  Pino + Pino HTTP + OpenTelemetry SDK
          |
          +--> stdout --> Fluent Bit / Vector --> Loki
          +--> OTLP ---------------------------> Tempo
          +--> /metrics -----------------------> Prometheus

Grafana reads from Loki, Tempo, and Prometheus.
Sentry receives unexpected application exceptions.
```

Do not create a logging microservice that every service calls over HTTP. If that
logging service is unavailable, application requests would become slower or fail.
Each service logs locally and sends telemetry through infrastructure collectors.

## 2. Simple Responsibility Table

| Component | Runs where | Responsibility |
|---|---|---|
| Pino | Every Node.js service | Creates structured application logs |
| Pino HTTP | Every HTTP service | Logs requests, responses, status, and duration |
| OpenTelemetry SDK | Every service and gateway | Creates and propagates trace context |
| Fluent Bit or Vector | Central infrastructure | Collects service stdout and ships logs |
| Loki | Central infrastructure | Stores and searches logs |
| Tempo | Central infrastructure | Stores and searches traces |
| Prometheus | Central infrastructure | Scrapes and stores numeric metrics |
| Grafana | Central infrastructure | Displays logs, traces, and metrics |
| Sentry | Central service | Groups unexpected exceptions and alerts engineers |

The central stack is installed once per environment, not once per service.

## 3. Services in This Repository

| Folder | Framework | Port | Local observability work |
|---|---|---:|---|
| `vendor-backend-api-gateway` | NestJS | 3000 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-identity-service` | NestJS | 3001 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-vendor-service` | Express | 3002 | Pino, HTTP logging middleware, tracing, metrics, error middleware |
| `vendor-backend-vendor-admin-service` | NestJS | 3003 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-subscription-service` | NestJS | 3004 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-payment-service` | NestJS | 3005 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-notification-service` | NestJS | 3006 | Pino, HTTP logging, tracing, metrics, error filter |
| `vendor-backend-activity-service` | NestJS | 3007 | Pino, HTTP logging, tracing, metrics, error filter |

## 4. Standard Fields

Every application log should include these fields when they are available:

- `timestamp`
- `level`
- `serviceName`
- `serviceVersion`
- `environment`
- `requestId`
- `traceId`
- `spanId`
- `method`
- `route`
- `statusCode`
- `durationMs`
- `vendorId` or `userId`, only when safe
- `errorCode`
- `err.type`, `err.message`, and `err.stack` for server errors

Never log passwords, JWTs, API keys, payment secrets, card data, or complete
sensitive request bodies. Use a stable request ID for one HTTP request and a
trace ID for the complete journey across services.

## 5. Implementation Order

Complete the work in this order:

1. Decide the log schema and environment names.
2. Deploy the central observability stack.
3. Add Pino to one service and validate its JSON output.
4. Add Pino HTTP request logging.
5. Add the global error handler or filter.
6. Add OpenTelemetry tracing and context propagation.
7. Add Prometheus metrics.
8. Repeat the same setup in every service.
9. Configure Fluent Bit or Vector to collect stdout.
10. Configure Grafana data sources and dashboards.
11. Add alerts and retention limits.
12. Test logs, errors, traces, metrics, and service failure behavior.

Do not start with dashboards. First make one service produce correct structured
telemetry, then copy the proven pattern to the other services.

## 6. Step 1: Install Service-Level Packages

For NestJS services, install the common packages in each service folder:

```bash
npm install pino pino-http nestjs-pino
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install prom-client @sentry/node
```

For the Express Vendor Service, install:

```bash
npm install pino pino-http
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install prom-client @sentry/node
```

Use the versions selected by the repository's package manager. Keep the package
versions consistent across services where possible.

## 7. Step 2: Configure the Common Environment

Use service-specific values with the same variable names:

```env
NODE_ENV=development
SERVICE_NAME=vendor-backend-payment-service
SERVICE_VERSION=0.1.0
LOG_LEVEL=info
OTEL_SERVICE_NAME=vendor-backend-payment-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
SENTRY_DSN=
METRICS_ENABLED=true
```

In production, use the real internal DNS names or service discovery names. Do
not commit secrets or environment files containing secrets.

## 8. Step 3: Configure the Central Infrastructure

Run these central components in the observability environment:

- Loki for log storage
- Tempo for trace storage
- Prometheus for metrics storage and scraping
- Grafana for dashboards and exploration
- Fluent Bit or Vector for container stdout collection
- Optional OpenTelemetry Collector between services and Tempo

A production flow is:

```text
Service stdout -> Fluent Bit / Vector -> Loki
Service OTLP data -> OpenTelemetry Collector -> Tempo
Service /metrics -> Prometheus
Grafana -> Loki + Tempo + Prometheus
```

Use persistent volumes for Loki, Tempo, Prometheus, and Grafana. Set retention
periods so observability storage cannot grow without a limit. Back up Grafana
dashboards and data-source configuration.

For local development, Docker Compose can run one copy of each central component.
For production, use managed or highly available deployments as the traffic and
retention requirements increase.

## 9. Step 4: Configure Pino in NestJS Services

Create one logger configuration per NestJS service. The logger should write JSON
to stdout and include the service name and environment.

Use `nestjs-pino` as the NestJS adapter. Register it in the root module and use
its request context so child logs automatically contain request and trace IDs.

Application code should log business events, for example:

```ts
logger.info({ vendorId, planId }, 'Subscription created');
logger.error({ paymentId, err }, 'Payment provider request failed');
```

Log useful facts, not full objects or sensitive provider responses.

## 10. Step 5: Configure Pino HTTP in NestJS Services

Configure the HTTP logger in every NestJS HTTP service and in the API Gateway.
It should record:

- HTTP method
- Route template
- Status code
- Request ID
- Trace ID
- Response duration
- Safe user or vendor identifier

Health checks should use a lower log level or be filtered if they create too much
noise. Keep error responses safe for clients even when the server log contains a
stack trace.

## 11. Step 6: Configure Errors in NestJS Services

Every NestJS service needs a global exception filter or equivalent error handler.
It must:

1. Convert known exceptions into the standard response shape.
2. Convert unknown exceptions into HTTP 500 responses.
3. Log the full server-side error with Pino.
4. Send unexpected exceptions to Sentry.
5. Return no stack trace, secret, SQL error, or provider response to the client.

Use this response shape:

```json
{
  "success": false,
  "statusCode": 500,
  "errorCode": "INTERNAL_ERROR",
  "message": "An internal error occurred",
  "requestId": "request-id",
  "traceId": "trace-id"
}
```

Do not add a `try/catch` to every method. Catch an error locally only when the
method can recover, translate an external error, add useful context, or clean up.

## 12. Step 7: Configure the Express Vendor Service

The existing Vendor Service uses Express, so its order is important:

1. Initialize tracing before importing application modules that need instrumented clients.
2. Add Pino HTTP middleware near the start of the middleware chain.
3. Add request ID and trace context propagation.
4. Add routes and business middleware.
5. Add one final error-handling middleware with four parameters.
6. Start the HTTP server only after the middleware is configured.

The final error middleware should log the error, send the safe standard response,
and call no downstream error handler after the response is finished.

## 13. Step 8: Configure OpenTelemetry

Initialize the OpenTelemetry SDK before the application starts. Instrument HTTP,
Express or NestJS, MySQL, Redis, Kafka, and other supported clients.

Propagate W3C trace context through HTTP headers. For Kafka messages, include the
trace context in message headers when publishing and restore it when consuming.

A trace should look like:

```text
API Gateway
  -> Subscription Service
      -> MySQL
      -> Redis
  -> Payment Service
      -> Payment Provider
```

Export OTLP data to the central collector or Tempo. Do not send traces directly
to every dashboard instance.

## 14. Step 9: Configure Prometheus Metrics

Expose a protected `/metrics` endpoint from every service. Prometheus scrapes
this endpoint from the central monitoring environment.

Start with these metrics:

- HTTP request count by service, method, route, and status
- HTTP request duration histogram
- HTTP 4xx and 5xx count
- Kafka consumer lag and processing failures
- Payment success and failure count
- Subscription activation failures
- Redis errors and connection state
- Process CPU, memory, and event-loop delay

Do not put user IDs, vendor IDs, payment IDs, or request IDs into metric labels.
High-cardinality labels can overload Prometheus.

## 15. Step 10: Configure Central Log Collection

Services write logs to stdout. The collector reads container logs and forwards
JSON records to Loki.

Use labels with low cardinality:

- `service`
- `environment`
- `level`
- `version`

Keep `requestId`, `traceId`, `vendorId`, and `paymentId` in the log body rather
than Loki labels. Grafana can search those fields without creating excessive
Loki index labels.

## 16. Step 11: Configure Grafana

Add these data sources in Grafana:

- Prometheus for metrics
- Loki for logs
- Tempo for traces

Create dashboards for:

### Service health

- Request rate
- 4xx and 5xx rate
- p95 and p99 latency
- CPU, memory, and event-loop delay
- Restart count

### Payment and subscription

- Payment order count
- Payment success and failure count
- Webhook verification failures
- Subscription activation failures
- Expired subscriptions
- Refund count

### Kafka and Redis

- Consumer lag
- Retry and dead-letter messages
- Redis errors
- Redis memory and connection usage

Configure Grafana links so a log with a `traceId` opens the matching Tempo trace.

## 17. Step 12: Service-by-Service Rollout

### API Gateway

- Add Pino and Pino HTTP.
- Add request ID and correlation ID handling.
- Start and propagate OpenTelemetry traces.
- Record route, upstream service, status, and latency.
- Add Prometheus metrics.
- Never log authorization headers or payment payloads.

### Identity Service

- Add the common logger and error filter.
- Redact passwords, tokens, and identity secrets.
- Trace database and Redis calls.
- Add login success, login failure, and rate-limit metrics.

### Vendor Service

- Add Pino HTTP middleware to the existing Express application.
- Add the final Express error middleware.
- Initialize OpenTelemetry before application startup.
- Preserve existing business behavior while adding telemetry.
- Add metrics for vendor API errors and latency.

### Vendor Admin Service

- Add the common logger and error filter.
- Log subscription event receipt and processing result.
- Trace MySQL, Redis, and Kafka operations.
- Add metrics for projection updates and failed consumers.

### Subscription Service

- Add the common logger and error filter.
- Log plan and subscription state transitions.
- Never log payment secrets or full provider payloads.
- Trace MySQL transactions, Redis cache operations, and Kafka events.
- Add metrics for activation, expiry, renewal, and failure.

### Payment Service

- Add the common logger and error filter.
- Redact provider secrets, signatures, and card-related data.
- Log webhook verification result and payment state transition.
- Trace provider calls and database transactions.
- Add metrics for payment success, failure, refund, and duplicate webhook events.

### Notification Service

- Add the common logger and error filter.
- Redact email addresses or message content when not required for debugging.
- Trace provider calls and retry attempts.
- Add delivery success, failure, and queue latency metrics.

### Activity Service

- Add the common logger and error filter.
- Log activity type and safe actor reference.
- Trace Kafka consumption and database writes.
- Add metrics for event processing rate, failures, retries, and lag.

## 18. Jest Tests for Errors and API Responses

Each service should test the behavior that clients can see and the log behavior
that operators need. Do not assert exact timestamps or generated IDs.

Minimum tests:

1. A successful request returns the expected status and response body.
2. A validation error returns `success: false` and a stable `errorCode`.
3. An unknown error returns HTTP 500 without a stack trace or secret.
4. The response contains `requestId` and `traceId`.
5. The logger receives an error record for an HTTP 500 response.
6. Sensitive fields are absent from the log record.
7. A duplicate webhook or Kafka event does not create a duplicate business effect.
8. The `/metrics` endpoint returns Prometheus text when enabled.

Use a test logger or a Pino destination stream in unit tests. Do not send test
logs to the production Loki or Sentry systems.

## 19. Redis Persistence and Multiple Services

Redis is shared infrastructure, but each service owns its key namespace. For
example:

```text
subscription:plans:*
payment:webhook:*
identity:session:*
vendor-admin:entitlement:*
```

Use Redis persistence only for data that must survive a restart. Configure AOF or
RDB according to the recovery requirement, but keep MySQL as the source of truth
for subscriptions, payments, and financial records. Redis cache entries must be
rebuildable and should have TTLs.

For multiple service instances:

- Use one managed Redis deployment or a Redis cluster.
- Use connection pooling and bounded timeouts.
- Use namespaced keys.
- Use distributed locks only when the operation truly needs one.
- Monitor memory, evictions, rejected connections, and latency.
- Do not assume a Redis lock replaces a database uniqueness constraint.

## 20. Kafka and Service Health

Kafka does not decide whether an HTTP server is free. Kafka brokers store and
replicate messages. Consumers read messages and report consumer lag.

Monitor:

- Broker health and under-replicated partitions
- Consumer lag
- Consumer restart count
- Retry topic size
- Dead-letter topic size
- Processing duration and failure count

Use consumer groups so each service instance shares the work. Commit an offset
only after the event is successfully processed or safely moved to a dead-letter
topic.

## 21. Alerts and Retention

Warning alerts:

- Increased 4xx or 5xx rate
- High p95 latency
- Growing Kafka consumer lag
- Redis memory pressure
- Increasing retry messages

Urgent alerts:

- Payment webhook failures
- Dead-letter topic growth
- Subscription activation failures
- Redis outage
- Kafka outage
- Repeated service restarts

Set retention for logs, traces, and metrics. Centralized observability is useful
only when its storage, cost, and access are controlled.

## 22. Definition of Done

The implementation is complete when:

- Every service emits structured JSON logs.
- Every HTTP service logs requests with request and trace IDs.
- Every service propagates distributed trace context.
- Every service exposes useful metrics.
- Fluent Bit or Vector ships logs to Loki.
- OpenTelemetry exports traces to Tempo.
- Prometheus scrapes all services.
- Grafana correlates metrics, logs, and traces.
- Errors use one safe response shape.
- Jest tests verify error responses and sensitive-data redaction.
- No service depends on a logging HTTP service to complete a request.
- Redis, Kafka, Loki, Tempo, Prometheus, and Grafana have health and capacity alerts.
