module.exports = {
  apps: [
    {
      name: "vendor-backend",
      script: "server.js",
      watch: true,   // enable auto reload
      ignore_watch: ["node_modules", "uploads", "logs"],
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
