# Subscription, Payment, and API Gateway Implementation Guide

This document explains how to implement the vendor subscription and payment workflow.

It describes the work to do. It does not contain application code.

## 1. Final Architecture

```text
Vendor UI
   |
Load Balancer / Nginx
   |
API Gateway
   |
   +--> Subscription Service
   |
   +--> Payment Service
   |
   +--> Vendor Admin Service

Payment Gateway
   |
   +--> Payment Service webhook

Payment Service -- Kafka --> Subscription Service
Subscription Service -- Kafka --> Vendor Admin Service

All services --> Central Redis
Each service --> Its own MySQL database
```

Use one MySQL deployment with a separate database for each service. Services must
access only their own database; cross-service data access happens through APIs or
Kafka events. Manage schema changes with versioned migrations, use foreign keys
within each service database, store timestamps in UTC, and wrap payment and
subscription state changes in database transactions.

## 2. Service Responsibilities

### Subscription Service

The Subscription Service owns:

- Plan catalog
- Plan prices and billing cycles
- Plan features and limits
- Vendor subscription records
- Subscription status
- Subscription start and expiry dates
- Subscription cancellation and renewal
- Subscription entitlements

It must not store card numbers, payment gateway secrets, or payment provider details.

### Payment Service

The Payment Service owns:

- Payment order creation
- Razorpay, Stripe, or another payment provider integration
- Payment status
- Gateway order and payment IDs
- Transaction ledger
- Refunds
- Invoices
- Payment webhook processing
- Payment idempotency

The Payment Service receives an amount and subscription reference, but it must validate the amount through a trusted server-side flow. Never trust a price sent only by the browser.

### API Gateway

The API Gateway owns:

- Public API entry point
- Routing requests to private services
- JWT validation
- Rate limiting
- Request IDs and correlation IDs
- Request logging
- Timeout and error handling
- Swagger aggregation, if required

The gateway must not contain subscription or payment business logic.

### Vendor Admin Service

The Vendor Admin Service consumes subscription events and updates vendor access:

- Enable paid features after activation
- Apply plan limits
- Disable paid features after expiry or cancellation
- Maintain vendor dashboard projections

## 3. Implementation Order

Complete the steps in this order:

1. Define shared business terms and statuses.
2. Create the Subscription Service data model.
3. Create the Payment Service data model.
4. Create the Subscription Service APIs.
5. Create the Payment Service APIs.
6. Configure the selected payment provider.
7. Configure the payment webhook.
8. Configure Kafka topics and consumers.
9. Configure centralized Redis usage.
10. Configure API Gateway routes and security.
11. Connect the Vendor UI.
12. Test success, failure, retry, refund, and expiry scenarios.

Do not start UI integration before the service contracts and payment webhook behavior are agreed.

## 4. Step 1: Define Shared Statuses

Define these statuses before creating APIs.

### Subscription statuses

- `PENDING_PAYMENT`: subscription created but payment is not confirmed
- `ACTIVE`: payment confirmed and features enabled
- `PAYMENT_FAILED`: payment failed
- `CANCELLED`: subscription cancelled
- `EXPIRED`: subscription reached its end date

### Payment statuses

- `CREATED`: payment order created
- `PENDING`: payment started but not confirmed
- `SUCCESS`: payment confirmed by the provider webhook
- `FAILED`: payment failed
- `REFUNDED`: payment refunded

Use the same status names in the database, API responses, Kafka events, and UI documentation.

## 5. Step 2: Create the Subscription Service Plan Model

Create the plan catalog first.

Each plan should define:

- Plan ID
- Name
- Description
- Price
- Currency
- Billing cycle: monthly or yearly
- Maximum products
- Maximum orders
- Feature flags
- Active or inactive state
- Creation and update timestamps

Only active plans should be shown to vendors.

Add an administrative process for creating, updating, activating, and deactivating plans. Do not allow a normal vendor to change plan prices or limits.

## 6. Step 3: Create the Vendor Subscription Model

The subscription record should contain:

- Subscription ID
- Vendor ID
- Plan ID
- Current status
- Price captured at subscription time
- Currency
- Billing cycle
- Start date
- End date
- Auto-renew setting
- Current payment ID
- Creation and update timestamps

Store the price used for the subscription. Do not recalculate historical payments from the current plan price.

A subscription belongs to the Subscription Service. Other services should store only the subscription ID and consume published events.

## 7. Step 4: Create the Payment Service Models

### Payment order

Store:

- Payment order ID
- Vendor ID
- Subscription ID
- Amount
- Currency
- Selected provider
- Provider order ID
- Provider payment ID
- Payment status
- Failure reason
- Creation and update timestamps

### Transaction ledger

Store:

- Transaction ID
- Payment order ID
- Vendor ID
- Amount
- Currency
- Type: charge or refund
- Provider response reference
- Created timestamp

Keep payment records and transaction records in the Payment Service database only.

## 8. Step 5: Implement Subscription APIs

Implement these APIs in the Subscription Service:

### Plan APIs

- `GET /plans`: list active plans
- `GET /plans/:id`: show one plan

### Subscription APIs

- `POST /subscriptions`: create a pending subscription
- `GET /subscriptions/vendor/:vendorId`: get the vendor subscription
- `GET /subscriptions/:id/status`: return current subscription status
- `PATCH /subscriptions/:id/cancel`: request cancellation
- `POST /subscriptions/:id/renew`: start a renewal flow

Rules:

- Require authentication for vendor APIs.
- Verify that the authenticated vendor owns the subscription.
- Create the subscription with `PENDING_PAYMENT`.
- Return the subscription ID, trusted amount, and currency.
- Do not mark a subscription `ACTIVE` from a browser response.

## 9. Step 6: Implement Payment APIs

Implement these APIs in the Payment Service:

- `POST /payments/orders`: create a provider payment order
- `GET /payments/:id`: return payment status for the owner
- `POST /payments/webhook`: receive provider webhook events
- `POST /payments/:id/refund`: request an authorized refund
- `GET /payments/vendor/:vendorId/invoices`: list vendor invoices

Rules:

- Require JWT authentication for normal payment APIs.
- Do not require vendor JWT authentication on the provider webhook.
- Verify the provider signature on every webhook.
- Confirm the payment order belongs to the expected subscription and vendor.
- Never activate a subscription from the frontend callback.
- Activate only after a verified provider webhook is processed.

## 10. Step 7: Choose and Configure the Payment Provider

Select one provider for the first implementation:

- Razorpay
- Stripe
- PayU

Keep the provider behind a common payment-provider boundary so another provider can be added later.

Configure these provider values through environment variables:

- Provider name
- Public key, if required by the UI
- Secret key
- Webhook secret
- Environment: test or production

Rules:

- Use test credentials locally.
- Never commit provider secrets.
- Never log provider secrets.
- Never store raw card information.
- Use the provider-hosted checkout or official SDK.
- Do not build or store your own card form unless compliance requirements are fully understood.

## 11. Step 8: Implement the Webhook Flow

The webhook flow is the payment source of truth.

1. The provider sends a webhook to the API Gateway.
2. The API Gateway routes it to the Payment Service.
3. The webhook route bypasses vendor JWT authentication.
4. The Payment Service verifies the provider signature.
5. The Payment Service checks whether the webhook was already processed.
6. The Payment Service updates the payment order.
7. The Payment Service creates or updates the transaction ledger.
8. The Payment Service publishes a Kafka event.
9. The Subscription Service consumes the event.
10. The Subscription Service changes subscription status.
11. The Subscription Service publishes a subscription event.
12. The Vendor Admin Service updates vendor access.

Return a successful response only after the webhook has been safely accepted and processed.

## 12. Step 9: Add Webhook Idempotency

Payment providers can send the same webhook more than once.

Use both of these protections:

- Store a provider event ID or unique provider payment ID in the Payment Service database.
- Store a short-lived idempotency key in centralized Redis.

When the same event arrives again:

1. Detect that it was already processed.
2. Do not create another transaction.
3. Do not publish a duplicate business effect.
4. Return a safe successful response.

Database uniqueness is the final protection. Redis alone must not be the only idempotency mechanism.

## 13. Step 10: Define Kafka Events

Use versioned topic names and documented event payloads.

### `payment.success.v1`

Contains:

- Payment order ID
- Subscription ID
- Vendor ID
- Amount
- Currency
- Provider payment ID
- Event ID
- Event timestamp

Consumer:

- Subscription Service

### `payment.failed.v1`

Contains:

- Payment order ID
- Subscription ID
- Vendor ID
- Failure reason
- Event ID
- Event timestamp

Consumer:

- Subscription Service

### `subscription.activated.v1`

Contains:

- Subscription ID
- Vendor ID
- Plan ID
- Plan limits
- Start date
- End date
- Event ID
- Event timestamp

Consumer:

- Vendor Admin Service

### `subscription.expired.v1`

Contains:

- Subscription ID
- Vendor ID
- Plan ID
- Expiry date
- Event ID
- Event timestamp

Consumer:

- Vendor Admin Service

Use a different consumer group for every independent consumer. Configure retry topics and dead-letter topics for failed messages.

## 14. Step 11: Implement Subscription Event Consumers

The Subscription Service consumes payment events.

For `payment.success.v1`:

1. Find the subscription by subscription ID.
2. Confirm the payment order matches the subscription.
3. Confirm the subscription is still waiting for payment.
4. Mark it `ACTIVE`.
5. Set the start date.
6. Calculate the end date from the billing cycle.
7. Store the payment ID.
8. Publish `subscription.activated.v1`.

For `payment.failed.v1`:

1. Find the subscription.
2. Confirm it is still pending.
3. Mark it `PAYMENT_FAILED`.
4. Store the failure reason.
5. Do not publish an activation event.

Consumers must be idempotent because Kafka can deliver a message more than once.

## 15. Step 12: Implement Vendor Admin Event Consumers

The Vendor Admin Service consumes subscription events.

For `subscription.activated.v1`:

1. Find the vendor projection.
2. Mark paid access as enabled.
3. Store the current plan ID.
4. Store the subscription end date.
5. Apply the plan limits.
6. Record the event ID as processed.

For `subscription.expired.v1`:

1. Find the vendor projection.
2. Disable paid features.
3. Apply free-tier limits.
4. Record the event ID as processed.

The Vendor Admin Service must not change subscription status directly. It reacts to Subscription Service events.

## 16. Step 13: Add Subscription Expiry and Renewal

The Subscription Service should run a scheduled job.

The job should:

1. Find active subscriptions whose end date has passed.
2. Change them to `EXPIRED` when renewal is not complete.
3. Publish `subscription.expired.v1`.
4. Start renewal only when auto-renew is enabled and payment is authorized.
5. Avoid publishing the same expiry event repeatedly.

Test timezone handling, month-end dates, yearly plans, cancellation dates, and failed renewals.

## 17. Step 14: Configure Central Redis

Use one centralized Redis deployment for all services.

Redis is used for:

- Plan-list caching
- Session data
- Payment webhook idempotency
- Payment-order rate limits
- Distributed locks
- Short-lived vendor entitlement cache

Use service-owned key prefixes:

- `subscription:plans:*`
- `subscription:status:*`
- `payment:webhook:*`
- `payment:rate-limit:*`
- `vendor-admin:entitlement:*`
- `identity:session:*`

MySQL remains the source of truth. Redis data must have an explicit TTL unless it is intentionally persistent coordination data.

## 18. Step 15: Configure API Gateway Routes

Configure these routes:

- `/api/plans/*` to Subscription Service
- `/api/subscriptions/*` to Subscription Service
- `/api/payments/orders` to Payment Service
- `/api/payments/:id` to Payment Service
- `/api/payments/:id/refund` to Payment Service
- `/api/payments/vendor/*/invoices` to Payment Service
- `/api/payments/webhook` to Payment Service without vendor JWT authentication
- `/api/vendor-admin/*` to Vendor Admin Service

For the webhook route:

- Do not attach vendor JWT middleware.
- Require provider signature verification in Payment Service.
- Apply request-size limits.
- Preserve the raw request body when the provider requires it.
- Add logging without recording payment secrets or card data.

## 19. Step 16: Define the UI Workflow

The UI flow is only a client flow. The backend remains the source of truth.

### Plan selection

1. Load active plans.
2. Show plan name, price, billing cycle, and limits.
3. Let the vendor select a plan.

### Checkout

1. Create a pending subscription.
2. Create a payment order using the trusted server response.
3. Open the official provider checkout.
4. Do not collect or store raw card information.

### Processing

1. Show a processing state after checkout.
2. Poll the subscription status or use a future push mechanism.
3. Do not show the plan as active only because the provider UI reports success.

### Result

- `ACTIVE`: show success and refresh vendor features.
- `PAYMENT_FAILED`: show retry action.
- `PENDING_PAYMENT`: continue processing or allow the vendor to retry.
- `EXPIRED` or `CANCELLED`: show the current state and available action.

## 20. Security Checklist

Before testing payments, confirm:

- JWT validation is enabled for normal APIs.
- Webhook routes use provider signature validation.
- Vendor ownership is checked.
- Amounts are validated server-side.
- Payment and subscription IDs are correlated.
- Webhooks are idempotent.
- Refunds require authorization.
- Secrets are stored only in environment or secret management systems.
- Card data is never stored.
- Logs do not contain tokens, secrets, or sensitive payment payloads.
- Rate limits prevent repeated order creation.
- Kafka consumers validate event shape and event version.

## 21. Testing Checklist

Test the complete workflow:

1. List active plans.
2. Create a pending subscription.
3. Create a payment order.
4. Complete a provider test payment.
5. Receive a valid webhook.
6. Reject an invalid webhook signature.
7. Send the same webhook twice.
8. Confirm only one transaction is created.
9. Confirm `payment.success.v1` is published.
10. Confirm the subscription becomes `ACTIVE`.
11. Confirm `subscription.activated.v1` is published.
12. Confirm vendor features are enabled.
13. Test a failed payment.
14. Test a delayed webhook.
15. Test an expired subscription.
16. Test a refund.
17. Test unauthorized vendor access.
18. Test duplicate payment-order requests.
19. Test Kafka consumer retry and dead-letter behavior.
20. Test Redis failure and database recovery behavior.

## 22. Completion Criteria

The workflow is ready when:

- Subscription and payment ownership is separate.
- All required APIs are documented in Swagger.
- Provider webhooks are signature verified.
- Payment confirmation comes only from the server-side webhook.
- Kafka events are versioned, retried, and idempotently consumed.
- Central Redis namespaces and TTLs are documented.
- Vendor access changes only after subscription events.
- Expiry and renewal behavior is tested.
- The UI never decides whether a subscription is active.
- Test and production provider credentials are separated.

## 23. Error and Logging Architecture

Use this design for every microservice:

```text
Business logic
      |
      v
Service exception handling
      |
      v
Global exception filter in the same service
      |
      +--> Structured JSON log to stdout
      |          |
      |          v
      |     Fluent Bit / Filebeat / Vector
      |          |
      |          v
      |     Loki or Elasticsearch
      |          |
      |          v
      |     Grafana dashboards and alerts
      |
      +--> Sentry error event and alert
```

### The clear industry decision

- Every service has its own global exception filter.
- Every service writes structured JSON logs locally to stdout.
- An infrastructure log agent ships logs centrally.
- Grafana is used for visualization and dashboards.
- Loki is used as the central log store for the first version.
- Sentry is used for exception grouping and error alerts.
- Do not create a master error microservice that every service calls over HTTP.

The application must not depend on a logging service being available before it can return an error response. Logging must be asynchronous and independent from the request path.

### What each service handles locally

Each service must:

1. Throw a meaningful domain or HTTP exception.
2. Convert unexpected exceptions through its global exception filter.
3. Return one consistent error response format.
4. Add the service name, environment, request ID, correlation ID, trace ID, route, status code, and duration to the log.
5. Include the stack trace in logs for server errors.
6. Avoid logging passwords, tokens, card details, provider secrets, or complete sensitive request bodies.
7. Send unexpected exceptions to Sentry.

### Standard error response

Use one response shape across the API Gateway and all HTTP services:

```text
success: false
statusCode: HTTP status code
errorCode: stable machine-readable code
message: safe human-readable message
requestId: request identifier
traceId: distributed trace identifier
```

Do not expose stack traces, database errors, provider secrets, or internal implementation details to the client.

## 24. Request Error Flow

```text
Vendor UI
   |
   v
Load Balancer / API Gateway
   |
   v
Service controller
   |
   v
Application service
   |
   +--> Expected business error
   |       |
   |       v
   |   Global exception filter
   |
   +--> Unexpected error
           |
           v
       Global exception filter
           |
           +--> Structured JSON log
           +--> Sentry event
           +--> Safe HTTP error response
```

Do not add `try/catch` to every function only for logging. Add local `try/catch` when the function can recover, translate an external error, add useful context, or perform cleanup. Let the global exception filter handle errors that cannot be recovered locally.

## 25. Kafka Consumer Error Flow

HTTP errors and Kafka message errors are handled differently.

```text
Kafka consumer receives event
          |
          v
Validate event ID, version, and payload
          |
          v
Process business action
          |
     +----+----+
     |         |
 success     failure
     |         |
 commit    log + retry
 offset       |
               v
       Retry topic with attempt number
               |
          +----+----+
          |         |
       succeeds   fails again
          |         |
        commit   retry until limit
                         |
                         v
                    Dead-letter topic
                         |
                         +--> Failed-event record
                         +--> Sentry alert
                         +--> Grafana alert
                         +--> Manual replay process
```

Kafka consumers must:

- Validate the event schema and version.
- Include the event ID in every log.
- Retry temporary failures.
- Send permanently failed messages to a dead-letter topic.
- Never silently discard a message.
- Store failed-event details for investigation and replay.
- Commit the Kafka offset only after successful processing or safe dead-letter publication.

## 26. Central Logging with Grafana and Loki

Use these components:

- Application services: write JSON logs to stdout.
- Fluent Bit, Filebeat, or Vector: collect container logs.
- Loki: store indexed log labels and log contents.
- Grafana: search logs, build dashboards, and configure alerts.
- Sentry: group exceptions and notify engineers about new error signatures.

Do not send every application log through an HTTP logging microservice.

### Required log fields

Every log entry should contain, where available:

- Timestamp
- Log level
- Service name
- Service version
- Environment
- Host or container ID
- Request ID
- Correlation ID
- Trace ID
- HTTP method
- Route
- Status code
- Duration in milliseconds
- User ID or vendor ID, when safe
- Kafka topic, partition, offset, and event ID for consumers
- Error code and stack trace for failures

### Grafana dashboards

Create these dashboards:

#### Service health dashboard

- Request count
- 4xx error rate
- 5xx error rate
- Average latency
- p95 latency
- p99 latency
- Service restart count
- CPU and memory usage

#### Payment dashboard

- Payment order creation count
- Payment success count
- Payment failure count
- Webhook verification failures
- Duplicate webhook count
- Refund count
- Provider response latency

#### Subscription dashboard

- Pending subscriptions
- Active subscriptions
- Failed payments
- Expired subscriptions
- Activation processing time
- Subscription event failures

#### Kafka dashboard

- Consumer lag by service
- Retry topic message count
- Dead-letter topic message count
- Consumer processing latency
- Consumer restart count

#### Redis dashboard

- Memory usage
- Cache hit and miss rate
- Evicted keys
- Expired keys
- Connection count
- Command latency
- Session and idempotency key errors

### Alerts

Send a warning to Slack for:

- Increased 4xx or 5xx rate
- High latency
- Kafka consumer lag
- Retry topic growth
- Redis memory pressure

Send an urgent alert to PagerDuty or the on-call channel for:

- Payment webhook failures
- Dead-letter topic growth
- Subscription activation failures
- Redis outage
- Kafka outage
- Repeated service restarts

## 27. SOLID Design Rules

Use SOLID to keep the services changeable and testable.

### Single Responsibility

Keep these responsibilities separate:

- Controller: receives and validates HTTP input.
- Application service: coordinates the use case.
- Domain service: applies business rules.
- Repository: reads and writes database records.
- Payment provider adapter: talks to Razorpay, Stripe, or PayU.
- Kafka publisher: publishes events.
- Kafka consumer: receives events.
- Redis client: manages cache, locks, sessions, and idempotency.
- Exception filter: converts exceptions into logs and HTTP responses.

### Open/Closed

Adding Stripe must not require rewriting the payment order service. Add a new provider adapter behind the existing payment-provider contract.

### Liskov Substitution

Every payment provider adapter must support the same required operations and return the same internal result shape.

### Interface Segregation

Do not create one large interface for every payment, Redis, Kafka, and database operation. Keep interfaces small and use-case specific.

### Dependency Inversion

Business logic should depend on interfaces such as payment provider, payment repository, event publisher, and idempotency store. Infrastructure adapters implement those interfaces.

## 28. Factory Method for Payment Providers

Use a Factory Method to select the payment provider from configuration:

```text
PAYMENT_PROVIDER=razorpay
          |
          v
Payment provider factory
          |
    +-----+-----+
    |           |
 Razorpay    Stripe
 adapter     adapter
```

The application service asks the factory for a provider. It must not create Razorpay or Stripe clients directly. The factory selects the provider using a validated environment value and fails during startup when the value is unsupported.

## 29. Circuit Breaker Rules

Use a circuit breaker around external calls that can become slow or unavailable:

- Payment provider APIs
- Identity Service calls from the API Gateway
- Subscription Service calls from the Vendor Admin Service
- Notification provider APIs

Circuit states:

- `CLOSED`: requests flow normally.
- `OPEN`: requests fail fast while the dependency is unhealthy.
- `HALF_OPEN`: a small number of test requests check recovery.

When the circuit is open:

- Return a safe temporary-unavailable response for synchronous APIs.
- Do not repeatedly call the failing provider.
- Log the state change once, not on every request.
- Alert through Grafana or Sentry when the state remains open.
- Use Kafka retry or scheduled retry for asynchronous work.

Do not use a circuit breaker as a replacement for idempotency, timeouts, retries, or provider webhook verification.

## 30. Idempotency Rules

Idempotency prevents duplicate business effects when a request or event is repeated.

Use idempotency for:

- Payment order creation
- Payment webhooks
- Refund requests
- Subscription activation events
- Subscription expiry events
- Kafka consumers

Every idempotent operation needs:

1. A stable idempotency key or event ID.
2. A database uniqueness constraint where possible.
3. A Redis short-term lock or lookup for fast duplicate detection.
4. A stored result or final status.
5. The same response for safe repeated requests.

Redis improves speed, but Redis alone is not the permanent source of truth. The database must protect financial and subscription state.

## 31. Final Operational Design

The final design is:

```text
Each microservice
  - local global exception filter
  - local structured JSON logging
  - local request and trace IDs
  - local input validation
  - local idempotent use cases
  - local circuit breakers for external calls
          |
          v
Container stdout
          |
          v
Fluent Bit / Filebeat / Vector
          |
          v
Central Loki log store
          |
          v
Grafana visualization and alerts

Exceptions also go to Sentry for grouping and notification.
Kafka failures go to retry topics and then dead-letter topics.
```

This is the recommended industry pattern for this project. Do not create a master error microservice for normal logging. Use centralized infrastructure for collection and visualization, while each service remains responsible for handling its own errors.

## 32. Centralized Logging Implementation Plan

The detailed, step-by-step implementation plan for centralized logging, errors,
HTTP logs, tracing, metrics, Grafana, Loki, Tempo, and Prometheus is in:

- [`centralized-observability-readme.md`](centralized-observability-readme.md)

That document covers every service in `VENDOR_BACKEND`, including the existing
Express Vendor Service and all NestJS services. It also defines the Jest tests
for error responses and the boundary between service-level instrumentation and
central observability infrastructure.





