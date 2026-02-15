const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vendor Admin API",
      version: "1.0.0",
      description: "Vendor Admin API Documentation"
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:5514"
      }
    ]
  },

  // FIXED PATH
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
