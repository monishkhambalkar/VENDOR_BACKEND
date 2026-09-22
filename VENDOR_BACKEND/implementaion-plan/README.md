# Vendor Backend Setup Guide

This guide explains what to install and how to start the Vendor Backend services.

## Services

| Service | Status | Port |
|---|---|---:|
| API Gateway | NestJS service to create | 3000 |
| Identity Service | NestJS service to create | 3001 |
| Vendor Service | Existing Express service | 3002 |
| Vendor Admin Service | NestJS service to create | 3003 |
| Subscription Service | NestJS service to create | 3004 |
| Payment Service | NestJS service to create | 3005 |
| Notification Service | NestJS service to create | 3006 |
| Activity Service | NestJS service to create | 3007 |
| Redis Infrastructure | Shared Redis configuration | 6379 |

The Vendor Service already contains application code and packages. The other NestJS service folders currently contain planning documentation, so their applications must be created.

For the complete centralized logging, error handling, HTTP logging, tracing, and
monitoring implementation plan, see
[`centralized-observability-readme.md`](centralized-observability-readme.md).

## Step 1: Open the Project

```bash
cd /var/www/a_practice/AMAZON_E-COMMERCE/VENDOR/VENDOR_BACKEND
```

Do not run `npm install` in this root folder. The root `package.json` belongs to the legacy Vendor Service repository layout; it is not a shared workspace package. Each service has its own `package.json`, `package-lock.json`, and `node_modules` folder. Run npm commands only after entering the service folder.

## Step 2: Check Global Software

Install these once on the computer, not once per service:

- Node.js 20 or newer
- npm 10 or newer
- Git
- Docker
- Docker Compose

Check them:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

Your current versions are already correct:

```text
Node.js 20.20.1
npm 10.8.2
Git 2.34.1
Docker 29.3.0
Docker Compose 2.39.4
```

## Step 3: Start Shared Infrastructure

All services share these infrastructure systems:

- MongoDB: database
- Redis: one central cache and session store
- Kafka: events and background work

### 3.1 Create the Docker network

Run once:

```bash
docker network create vendor-backend-network 2>/dev/null || true
```

### 3.2 MongoDB

Run this only if MongoDB is not already using port `27017`:

```bash
docker run -d --name vendor-mongodb \
  --network vendor-backend-network \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7
```

You already have a local MongoDB on port `27017`, so do not start another MongoDB container unless that service is stopped.

### 3.3 Central Redis

There is one Redis deployment for all services. Do not create one Redis container per service.

Run this only if port `6379` is free:

```bash
docker run -d --name vendor-central-redis \
  --network vendor-backend-network \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass change-me-local-redis-password
```

Check Redis:

```bash
docker ps
docker exec vendor-central-redis redis-cli -a change-me-local-redis-password ping
```

Expected result:

```text
PONG
```

If another Redis is already running on port `6379`, use it. All services use the same Redis connection:

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=change-me-local-redis-password
```

For the currently running Redis without a password, use an empty password during local development:

```env
REDIS_PASSWORD=
```

### 3.4 Kafka

Run once:

```bash
docker run -d --name vendor-kafka \
  --network vendor-backend-network \
  -p 9092:9092 \
  -e KAFKA_NODE_ID=1 \
  -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,EXTERNAL:PLAINTEXT \
  -e KAFKA_LISTENERS=PLAINTEXT://:29092,CONTROLLER://:29093,EXTERNAL://:9092 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://vendor-kafka:29092,EXTERNAL://localhost:9092 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@vendor-kafka:29093 \
  apache/kafka:4.0.0
```

Host applications use:

```env
KAFKA_BROKERS=localhost:9092
```

## Step 4: Understand Package Installation

Runtime packages are needed when the service is running. Examples: NestJS, MongoDB, Redis, Kafka, Swagger.

Development packages are needed to build, test, format, and run watch mode. Examples: TypeScript, Jest, ESLint, Prettier, and the Nest CLI.

Install packages inside the service folder, not in the project root. For example:

```bash
cd vendor-backend-api-gateway
npm install <packages>
```

## Step 5: Create a NestJS Service

Use these commands only for the new NestJS services:

```bash
cd /var/www/a_practice/AMAZON_E-COMMERCE/VENDOR/VENDOR_BACKEND/<service-folder>
npx @nestjs/cli new bootstrap --skip-git --package-manager npm
mv bootstrap/* .
mv bootstrap/.[!.]* . 2>/dev/null || true
rm -rf bootstrap
```

Replace `<service-folder>` with one service folder, for example:

```text
vendor-backend-api-gateway
vendor-backend-identity-service
vendor-backend-vendor-admin-service
vendor-backend-subscription-service
vendor-backend-payment-service
vendor-backend-notification-service
vendor-backend-activity-service
```

The service folder already contains a README, so generating into a temporary `bootstrap` folder avoids overwriting it.

Do not run this step for `vendor-backend-vendor-service`. That service already exists.

## Step 6: Install Common NestJS Packages

Run this inside every new NestJS service:

```bash
npm install @nestjs/config@4.0.4 @nestjs/swagger@11.2.0 swagger-ui-express class-transformer class-validator @nestjs/terminus@11.1.1 helmet compression ioredis kafkajs
```

Install development packages inside every new NestJS service:

```bash
npm install --save-dev typescript@5.7.3 ts-node ts-jest @types/node jest @types/jest supertest @types/supertest eslint prettier @nestjs/cli@11.0.24
```

Run the commands separately inside these new service folders:

```text
vendor-backend-api-gateway
vendor-backend-identity-service
vendor-backend-vendor-admin-service
vendor-backend-subscription-service
vendor-backend-payment-service
vendor-backend-notification-service
vendor-backend-activity-service
```

Add these scripts to each NestJS `package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "test": "jest",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src,test}/**/*.ts\""
  }
}
```

## Step 7: Create the Environment File

Inside each service:

```bash
cp .env.example .env.local
```

Never commit `.env.local`. The `.env.example` files are already provided in all service folders.

Use these common Redis values in every NestJS service:

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_NAMESPACE=<service-name>
```

Each service gets a different namespace, but all services connect to the same Redis server.

## Step 8: Configure Swagger

Swagger is already installed in the common package command.

In every NestJS service, add this to `src/main.ts`:

```ts
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || "Vendor Backend API")
    .setDescription(process.env.SWAGGER_DESCRIPTION || "Service API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PATH || "docs", app, document);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
```

Swagger URLs:

```text
API Gateway:          http://localhost:3000/docs
Identity Service:     http://localhost:3001/docs
Vendor Service:       http://localhost:3002/api-docs
Vendor Admin Service: http://localhost:3003/docs
Subscription Service: http://localhost:3004/docs
Payment Service:      http://localhost:3005/docs
Notification Service: http://localhost:3006/docs
Activity Service:     http://localhost:3007/docs
```

## Step 9: Service-by-Service Setup

### 9.1 API Gateway

Folder:

```bash
cd vendor-backend-api-gateway
```

Status: new NestJS application.

Install these extra packages:

```bash
npm install @nestjs/axios@4.0.1 axios @nestjs/throttler jose opossum
```

Set:

```env
PORT=3000
REDIS_NAMESPACE=api-gateway
```

The gateway calls the private services and validates JWT tokens. Start it last.

### 9.2 Identity Service

Folder:

```bash
cd vendor-backend-identity-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose @nestjs/jwt@11.0.2 jose argon2
```

Set:

```env
PORT=3001
REDIS_NAMESPACE=identity
MONGODB_URI=mongodb://127.0.0.1:27017/identity_db
```

Use Redis for sessions, refresh-token state, and rate limits.

### 9.3 Vendor Service

Folder:

```bash
cd vendor-backend-vendor-service
```

Status: already exists. Do not generate NestJS files here.

Install the existing packages:

```bash
npm install
```

Install only the missing development packages:

```bash
npm install --save-dev nodemon jest supertest ts-jest @types/jest @types/node
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Set these local values:

```env
PORT=3002
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_NAMESPACE=vendor
```

Existing Swagger is already available at:

```text
http://localhost:3002/api-docs
```

Start it:

```bash
npm run config:local
npm run dev
```

### 9.4 Vendor Admin Service

Folder:

```bash
cd vendor-backend-vendor-admin-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose
```

Set:

```env
PORT=3003
REDIS_NAMESPACE=vendor-admin
MONGODB_URI=mongodb://127.0.0.1:27017/vendor_admin_db
KAFKA_CLIENT_ID=vendor-admin-service
KAFKA_GROUP_ID=vendor-admin-service-consumer
```

### 9.5 Subscription Service

Folder:

```bash
cd vendor-backend-subscription-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose @nestjs/schedule@6.1.3 cron
```

Set:

```env
PORT=3004
REDIS_NAMESPACE=subscription
MONGODB_URI=mongodb://127.0.0.1:27017/subscription_db
KAFKA_CLIENT_ID=subscription-service
KAFKA_GROUP_ID=subscription-service-consumer
```

### 9.6 Payment Service

Folder:

```bash
cd vendor-backend-payment-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose razorpay stripe
```

Use only the payment provider selected by the project.

Set:

```env
PORT=3005
REDIS_NAMESPACE=payment
MONGODB_URI=mongodb://127.0.0.1:27017/payment_db
KAFKA_CLIENT_ID=payment-service
KAFKA_GROUP_ID=payment-service-consumer
PAYMENT_PROVIDER=razorpay
```

### 9.7 Notification Service

Folder:

```bash
cd vendor-backend-notification-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose nodemailer handlebars
```

Set:

```env
PORT=3006
REDIS_NAMESPACE=notification
MONGODB_URI=mongodb://127.0.0.1:27017/notification_db
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-consumer
```

### 9.8 Activity Service

Folder:

```bash
cd vendor-backend-activity-service
```

Status: new NestJS application.

Install:

```bash
npm install @nestjs/mongoose@11.0.4 mongoose
```

Set:

```env
PORT=3007
REDIS_NAMESPACE=activity
MONGODB_URI=mongodb://127.0.0.1:27017/activity_db
KAFKA_CLIENT_ID=activity-service
KAFKA_GROUP_ID=activity-service-consumer
```

## Step 10: Redis Key Rules

All services use the same Redis server, but they must use different key prefixes:

```text
identity:session:<id>
vendor:cache:product:<id>
subscription:entitlement:<vendorId>
payment:idempotency:<key>
notification:retry:<eventId>
activity:risk:<userId>
```

Do not use generic keys such as `user`, `data`, or `cache`. Always add the service name.

Redis stores temporary or fast data. MongoDB remains the permanent source of truth.

## Step 11: Start the Services

Start infrastructure first:

```bash
docker ps
```

Then start services in this order, using one terminal per service:

1. Identity Service, port `3001`
2. Vendor Service, port `3002`
3. Vendor Admin Service, port `3003`
4. Subscription Service, port `3004`
5. Payment Service, port `3005`
6. Notification Service, port `3006`
7. Activity Service, port `3007`
8. API Gateway, port `3000`

For new NestJS services:

```bash
npm run start:dev
```

For the existing Vendor Service:

```bash
npm run dev
```

## Step 12: Check the Setup

For each service, run:

```bash
npm run build
npm test
```

Check Swagger in a browser using the URLs above.

Check the service health endpoint when it has been implemented:

```bash
curl http://localhost:<port>/health
```

## Important Rules

- Do not run `npm install` in the root folder.
- Do not create one Redis container per service.
- Do not generate NestJS files inside the existing Vendor Service.
- Do not commit `.env.local` or secrets.
- Do not store permanent business data only in Redis.
- Use Kafka for events and consumer groups.
- Use separate Redis namespaces for each service.
