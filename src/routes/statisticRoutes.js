const { Router } = require("express");
const { getConnection } = require("../database/connection");

const router = Router();

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Get global statistics
 *     description: Returns aggregated statistics including question counts, quiz performance, and category/difficulty breakdowns.
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Global statistics
 */
router.get("/statistics", (req, res) => {
  const db = getConnection();

  const questionStats = db
    .prepare("SELECT COUNT(*) as total FROM questions")
    .get();

  const categoryBreakdown = db
    .prepare(
      `SELECT category, COUNT(*) as count
       FROM questions
       GROUP BY category
       ORDER BY count DESC`
    )
    .all();

  const difficultyBreakdown = db
    .prepare(
      `SELECT difficulty, COUNT(*) as count
       FROM questions
       GROUP BY difficulty
       ORDER BY CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END`
    )
    .all();

  const quizStats = db
    .prepare(
      `SELECT
         COUNT(*) as totalQuizzes,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedQuizzes,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeQuizzes
       FROM quizzes`
    )
    .get();

  const scoreStats = db
    .prepare(
      `SELECT
         ROUND(AVG(score), 2) as averageScore,
         ROUND(AVG(CAST(score AS FLOAT) / total_questions * 100), 1) as averagePercentage,
         MAX(score) as highestScore,
         MIN(score) as lowestScore
       FROM quizzes
       WHERE status = 'completed'`
    )
    .get();

  const difficultyPerformance = db
    .prepare(
      `SELECT
         q.difficulty,
         COUNT(qq.id) as totalAnswered,
         SUM(CASE WHEN qq.is_correct = 1 THEN 1 ELSE 0 END) as correctAnswers,
         ROUND(CAST(SUM(CASE WHEN qq.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(qq.id) * 100, 1) as successRate
       FROM quiz_questions qq
       JOIN questions q ON qq.question_id = q.id
       WHERE qq.selected_option_id IS NOT NULL
       GROUP BY q.difficulty
       ORDER BY CASE q.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END`
    )
    .all();

  const categoryPerformance = db
    .prepare(
      `SELECT
         q.category,
         COUNT(qq.id) as totalAnswered,
         SUM(CASE WHEN qq.is_correct = 1 THEN 1 ELSE 0 END) as correctAnswers,
         ROUND(CAST(SUM(CASE WHEN qq.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(qq.id) * 100, 1) as successRate
       FROM quiz_questions qq
       JOIN questions q ON qq.question_id = q.id
       WHERE qq.selected_option_id IS NOT NULL
       GROUP BY q.category
       ORDER BY successRate DESC`
    )
    .all();

  res.json({
    success: true,
    data: {
      questions: {
        total: questionStats.total,
        byCategory: categoryBreakdown,
        byDifficulty: difficultyBreakdown,
      },
      quizzes: {
        total: quizStats.totalQuizzes,
        completed: quizStats.completedQuizzes,
        active: quizStats.activeQuizzes,
      },
      performance: {
        averageScore: scoreStats.averageScore || 0,
        averagePercentage: scoreStats.averagePercentage || 0,
        highestScore: scoreStats.highestScore || 0,
        lowestScore: scoreStats.lowestScore || 0,
        byDifficulty: difficultyPerformance,
        byCategory: categoryPerformance,
      },
    },
  });
});

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get the leaderboard
 *     description: Returns completed quizzes ranked by score (descending) and completion time (ascending).
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results (max 100)
 *     responses:
 *       200:
 *         description: Leaderboard rankings
 */
router.get("/leaderboard", (req, res) => {
  const db = getConnection();
  const { category, difficulty, limit = 10 } = req.query;

  const conditions = ["status = 'completed'"];
  const params = [];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (difficulty) {
    conditions.push("difficulty = ?");
    params.push(difficulty);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const rankings = db
    .prepare(
      `SELECT
         id as quizId,
         score,
         total_questions as totalQuestions,
         ROUND(CAST(score AS FLOAT) / total_questions * 100, 1) as percentage,
         category,
         difficulty,
         time_limit as timeLimit,
         created_at as createdAt,
         completed_at as completedAt,
         ROUND((julianday(completed_at) - julianday(created_at)) * 86400) as durationSeconds
       FROM quizzes
       ${whereClause}
       ORDER BY percentage DESC, durationSeconds ASC
       LIMIT ?`
    )
    .all(...params, safeLimit);

  const result = rankings.map((r, index) => ({
    rank: index + 1,
    ...r,
  }));

  res.json({ success: true, data: result });
});

module.exports = router;
