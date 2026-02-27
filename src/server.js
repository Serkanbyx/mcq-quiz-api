require("dotenv").config();
const app = require("./app");
const { initializeDatabase } = require("./database/schema");
const { closeConnection } = require("./database/connection");

const PORT = process.env.PORT || 3000;

initializeDatabase();
console.log("Database initialized successfully.");

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    closeConnection();
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
