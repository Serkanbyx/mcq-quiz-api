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

app.get("/", (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MCQ Quiz API</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: #0f0c29;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      color: #e8e6f0;
      overflow: hidden;
      position: relative;
    }

    body::before {
      content: "?";
      position: fixed;
      top: -60px;
      left: -40px;
      font-size: 320px;
      font-weight: 900;
      color: rgba(167, 139, 250, 0.04);
      pointer-events: none;
      transform: rotate(-15deg);
    }

    body::after {
      content: "A B C D";
      position: fixed;
      bottom: -30px;
      right: -20px;
      font-size: 160px;
      font-weight: 800;
      letter-spacing: 24px;
      color: rgba(52, 211, 153, 0.04);
      pointer-events: none;
      transform: rotate(8deg);
    }

    .quiz-bubble {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.06;
    }

    .quiz-bubble:nth-child(1) {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #a78bfa, transparent 70%);
      top: 10%; left: 5%;
      animation: float 8s ease-in-out infinite;
    }
    .quiz-bubble:nth-child(2) {
      width: 200px; height: 200px;
      background: radial-gradient(circle, #34d399, transparent 70%);
      top: 60%; right: 8%;
      animation: float 10s ease-in-out infinite reverse;
    }
    .quiz-bubble:nth-child(3) {
      width: 150px; height: 150px;
      background: radial-gradient(circle, #fbbf24, transparent 70%);
      bottom: 15%; left: 20%;
      animation: float 7s ease-in-out infinite 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-30px) scale(1.05); }
    }

    .container {
      text-align: center;
      padding: 48px 40px;
      max-width: 520px;
      width: 90%;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(167, 139, 250, 0.15);
      border-radius: 24px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      position: relative;
      z-index: 1;
    }

    .container::before {
      content: "";
      position: absolute;
      top: -1px; left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #a78bfa, #34d399, transparent);
      border-radius: 2px;
    }

    .quiz-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px; height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(167, 139, 250, 0.3);
      position: relative;
    }

    .quiz-icon::after {
      content: "?";
      font-size: 36px;
      font-weight: 800;
      color: #fff;
    }

    .quiz-icon::before {
      content: "";
      position: absolute;
      inset: -3px;
      border-radius: 22px;
      background: linear-gradient(135deg, #a78bfa, #34d399);
      z-index: -1;
      opacity: 0.4;
      filter: blur(8px);
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #e0dbff 0%, #a78bfa 40%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .version {
      font-size: 0.85rem;
      font-weight: 600;
      color: #a78bfa;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 32px;
      opacity: 0.8;
    }

    .option-labels {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .option-label {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      border: 2px solid rgba(167, 139, 250, 0.2);
      color: rgba(167, 139, 250, 0.6);
      transition: all 0.3s ease;
    }

    .option-label.active {
      background: linear-gradient(135deg, #34d399, #059669);
      border-color: #34d399;
      color: #fff;
      box-shadow: 0 2px 12px rgba(52, 211, 153, 0.3);
      transform: scale(1.1);
    }

    .links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 36px;
    }

    .links a {
      display: block;
      padding: 14px 28px;
      border-radius: 14px;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.3px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      color: #fff;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(124, 58, 237, 0.45);
      filter: brightness(1.1);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #c4b5fd;
      border: 1px solid rgba(167, 139, 250, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(167, 139, 250, 0.1);
      border-color: rgba(167, 139, 250, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(167, 139, 250, 0.15);
    }

    .btn-tertiary {
      background: rgba(52, 211, 153, 0.08);
      color: #6ee7b7;
      border: 1px solid rgba(52, 211, 153, 0.15);
    }

    .btn-tertiary:hover {
      background: rgba(52, 211, 153, 0.15);
      border-color: rgba(52, 211, 153, 0.35);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(52, 211, 153, 0.15);
    }

    footer.sign {
      font-size: 0.8rem;
      color: rgba(196, 181, 253, 0.5);
      padding-top: 20px;
      border-top: 1px solid rgba(167, 139, 250, 0.08);
    }

    footer.sign a {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    footer.sign a:hover {
      color: #34d399;
    }

    @media (max-width: 480px) {
      .container { padding: 36px 24px; }
      h1 { font-size: 1.6rem; }
    }
  </style>
</head>
<body>
  <div class="quiz-bubble"></div>
  <div class="quiz-bubble"></div>
  <div class="quiz-bubble"></div>

  <div class="container">
    <div class="quiz-icon"></div>
    <h1>MCQ Quiz API</h1>
    <p class="version">v1.0.0</p>

    <div class="option-labels">
      <span class="option-label">A</span>
      <span class="option-label">B</span>
      <span class="option-label active">C</span>
      <span class="option-label">D</span>
    </div>

    <div class="links">
      <a href="/api-docs" class="btn-primary">API Documentation</a>
      <a href="/api" class="btn-secondary">API Endpoints</a>
      <a href="/api/health" class="btn-tertiary">Health Check</a>
    </div>

    <footer class="sign">
      Created by
      <a href="https://serkanbayraktar.com/" target="_blank" rel="noopener noreferrer">Serkanby</a>
      |
      <a href="https://github.com/Serkanbyx" target="_blank" rel="noopener noreferrer">Github</a>
    </footer>
  </div>
</body>
</html>`;
  res.type("html").send(html);
});

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

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use("/api/questions", questionRoutes);
app.use("/api/quizzes", quizRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
