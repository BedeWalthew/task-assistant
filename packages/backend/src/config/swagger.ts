import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Assistant API",
      version: "1.0.0",
      description: "API documentation for Task Assistant",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/areas/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
