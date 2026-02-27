const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MCQ Quiz API",
    version: "1.1.0",
    description:
      "A REST API for multiple-choice quiz games with random question selection, timed quizzes, score calculation, statistics, and leaderboard.",
    contact: {
      name: "Serkanby",
      url: "https://serkanbayraktar.com/",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Questions", description: "Manage quiz questions and options" },
    { name: "Quizzes", description: "Start quizzes, submit answers, get scores" },
    { name: "Statistics", description: "Global statistics and leaderboard" },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
