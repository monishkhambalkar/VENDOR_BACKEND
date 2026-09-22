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
