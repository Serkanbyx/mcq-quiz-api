const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const questionRoutes = require("./routes/questionRoutes");
const quizRoutes = require("./routes/quizRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (_req, res) => {
  res.json({
    success: true,
    message: "MCQ Quiz API",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      questions: "/api/questions",
      quizzes: "/api/quizzes",
    },
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use("/api/questions", questionRoutes);
app.use("/api/quizzes", quizRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
