## Recommendation

Use **one global PM2 installation** and one PM2 ecosystem file for the whole project.

Do not install or run a separate PM2 daemon inside every service. PM2 can manage all your Node.js services from one place, with separate names, logs, restarts, and status.

Your structure is suitable for this approach:

- `vendor-backend-api-gateway`
- `vendor-backend-activity-service`
- `vendor-backend-identity-service`
- `vendor-backend-notification-service`
- `vendor-backend-payment-service`
- `vendor-backend-subscription-service`
- `vendor-backend-vendor-admin-service`
- `vendor-backend-vendor-service`

## 1. Install PM2 globally

Run:

```bash
sudo npm install -g pm2
```

Verify:

```bash
pm2 --version
```

## 2. Build each NestJS service

From the project root:

```bash
cd /var/www/a_practice/AMAZON_E-COMMERCE/VENDOR/VENDOR_BACKEND
```

Install dependencies and build each NestJS service:

```bash
for service in \
  vendor-backend-api-gateway \
  vendor-backend-activity-service \
  vendor-backend-identity-service \
  vendor-backend-notification-service \
  vendor-backend-payment-service \
  vendor-backend-subscription-service \
  vendor-backend-vendor-admin-service
do
  npm --prefix "$service" install
  npm --prefix "$service" run build
done
```

Install dependencies for the older vendor service:

```bash
npm --prefix vendor-backend-vendor-service install
```

Check that the Nest build generated files such as:

```text
vendor-backend-api-gateway/dist/main.js
```

## 3. Create an ecosystem configuration

Create this file manually:

```text
/var/www/a_practice/AMAZON_E-COMMERCE/VENDOR/VENDOR_BACKEND/ecosystem.config.cjs
```

Add:

```javascript
module.exports = {
  apps: [
    {
      name: 'vendor-api-gateway',
      cwd: './vendor-backend-api-gateway',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-activity-service',
      cwd: './vendor-backend-activity-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-identity-service',
      cwd: './vendor-backend-identity-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-notification-service',
      cwd: './vendor-backend-notification-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-payment-service',
      cwd: './vendor-backend-payment-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-subscription-service',
      cwd: './vendor-backend-subscription-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-admin-service',
      cwd: './vendor-backend-vendor-admin-service',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    {
      name: 'vendor-service',
      cwd: './vendor-backend-vendor-service',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3007
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

Important: the ports must match the ports configured inside each service. If a service has a hardcoded port, update that service or remove the `PORT` value from the PM2 configuration.

## 4. Start all services

From the project root:

```bash
pm2 start ecosystem.config.cjs
```

Check all processes:

```bash
pm2 status
```

You should see each service with status:

```text
online
```

## 5. Check logs

View logs for every service:

```bash
pm2 logs
```

View logs for one service:

```bash
pm2 logs vendor-api-gateway
```

Show only the last 100 lines:

```bash
pm2 logs vendor-api-gateway --lines 100
```

PM2 log files are normally stored here:

```text
~/.pm2/logs/
```

## 6. Useful monitoring commands

```bash
pm2 monit
```

This shows CPU, memory, restarts, and live output.

```bash
pm2 show vendor-api-gateway
```

```bash
pm2 describe vendor-api-gateway
```

Restart one service:

```bash
pm2 restart vendor-api-gateway
```

Restart everything:

```bash
pm2 restart ecosystem.config.cjs
```

Stop one service:

```bash
pm2 stop vendor-api-gateway
```

Remove one service from PM2:

```bash
pm2 delete vendor-api-gateway
```

Reload the ecosystem configuration:

```bash
pm2 reload ecosystem.config.cjs
```

## 7. Enable automatic startup after server reboot

Run:

```bash
pm2 startup
```

PM2 will print a command containing your username and Node.js path. Copy and execute that command exactly.

Then save the currently running process list:

```bash
pm2 save
```

Test the setup by rebooting:

```bash
sudo reboot
```

After reconnecting:

```bash
pm2 status
```

Your services should automatically return to `online`.

## 8. After changing source code

For a NestJS service:

```bash
cd vendor-backend-api-gateway
npm run build
pm2 restart vendor-api-gateway
```

For a complete rebuild:

```bash
cd /var/www/a_practice/AMAZON_E-COMMERCE/VENDOR/VENDOR_BACKEND

for service in \
  vendor-backend-api-gateway \
  vendor-backend-activity-service \
  vendor-backend-identity-service \
  vendor-backend-notification-service \
  vendor-backend-payment-service \
  vendor-backend-subscription-service \
  vendor-backend-vendor-admin-service
do
  npm --prefix "$service" run build
done

pm2 restart ecosystem.config.cjs
pm2 save
```

## Important production advice

Use PM2 for process management, but continue using Nginx as the public reverse proxy:

```text
Client -> Nginx -> API Gateway -> Internal Services
```

Only expose the API gateway publicly. The identity, payment, subscription, notification, and admin services should normally listen on internal ports only.

For production:

- Keep `watch: false`.
- Use separate `.env` files or secure environment variables.
- Do not run services with `sudo`.
- Use `pm2 save` after changing the process list.
- Use `pm2 logs`, `pm2 monit`, and `pm2 status` for operational checks.
- Use unique ports for every service.
- Ensure each service handles `SIGTERM` correctly before relying on zero-downtime reloads.