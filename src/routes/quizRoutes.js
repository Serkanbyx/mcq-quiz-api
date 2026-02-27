const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("../database/connection");
const { AppError } = require("../middleware/errorHandler");
const { validateStartQuiz, validateSubmitAnswer } = require("../middleware/validate");

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StartQuizBody:
 *       type: object
 *       properties:
 *         totalQuestions:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *           example: 5
 *         category:
 *           type: string
 *           enum: [general, web, javascript, computer-science, database]
 *           example: "javascript"
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: "medium"
 *         timeLimit:
 *           type: integer
 *           minimum: 30
 *           maximum: 3600
 *           description: "Time limit in seconds (optional, 30-3600)"
 *           example: 300
 *     SubmitAnswerBody:
 *       type: object
 *       required:
 *         - optionId
 *       properties:
 *         optionId:
 *           type: integer
 *           example: 3
 *         timeSpent:
 *           type: integer
 *           description: "Time spent on this question in seconds (optional)"
 *           example: 15
 *     QuizStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         totalQuestions:
 *           type: integer
 *           example: 5
 *         currentIndex:
 *           type: integer
 *           example: 0
 *         score:
 *           type: integer
 *           example: 0
 *         status:
 *           type: string
 *           enum: [active, completed]
 *         category:
 *           type: string
 *         difficulty:
 *           type: string
 */

/**
 * Fisher-Yates shuffle for random question selection.
 * Returns a new shuffled array without mutating the original.
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * @swagger
 * /quizzes:
 *   post:
 *     summary: Start a new quiz
 *     description: Creates a new quiz with randomly selected questions. Optionally filter by category and difficulty.
 *     tags: [Quizzes]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartQuizBody'
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Validation error or not enough questions
 */
router.post("/", validateStartQuiz, (req, res, next) => {
  const db = getConnection();
  const { totalQuestions = 10, category, difficulty, timeLimit } = req.body;

  const conditions = [];
  const params = [];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (difficulty) {
    conditions.push("difficulty = ?");
    params.push(difficulty);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const allQuestions = db.prepare(`SELECT id FROM questions ${whereClause}`).all(...params);

  if (allQuestions.length === 0) {
    return next(new AppError("No questions available for the selected filters", 400));
  }

  const count = Math.min(Number(totalQuestions), allQuestions.length);
  const selectedQuestions = shuffleArray(allQuestions).slice(0, count);

  const quizId = uuidv4();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      "INSERT INTO quizzes (id, total_questions, category, difficulty, time_limit, started_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(quizId, count, category || null, difficulty || null, timeLimit || null, now);

    const insertQuizQuestion = db.prepare(
      "INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (?, ?, ?)"
    );

    selectedQuestions.forEach((q, index) => {
      insertQuizQuestion.run(quizId, q.id, index);
    });
  })();

  const firstQuestion = getQuestionByOrder(db, quizId, 0);

  const responseData = {
    quizId,
    totalQuestions: count,
    currentQuestion: 1,
    status: "active",
    question: firstQuestion,
  };

  if (timeLimit) {
    responseData.timeLimit = Number(timeLimit);
    responseData.timeRemaining = Number(timeLimit);
  }

  res.status(201).json({ success: true, data: responseData });
});

/**
 * @swagger
 * /quizzes/{quizId}:
 *   get:
 *     summary: Get quiz status and current question
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 *       404:
 *         description: Quiz not found
 */
router.get("/:quizId", (req, res, next) => {
  const db = getConnection();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.quizId);

  if (!quiz) {
    return next(new AppError("Quiz not found", 404));
  }

  if (quiz.status === "active" && quiz.time_limit && quiz.started_at) {
    const elapsed = Math.floor((Date.now() - new Date(quiz.started_at).getTime()) / 1000);
    if (elapsed >= quiz.time_limit) {
      db.prepare(
        "UPDATE quizzes SET status = 'completed', completed_at = datetime('now') WHERE id = ?"
      ).run(quiz.id);
      quiz.status = "completed";
      quiz.completed_at = new Date().toISOString();
    }
  }

  const response = {
    id: quiz.id,
    totalQuestions: quiz.total_questions,
    currentQuestion: quiz.current_index + 1,
    score: quiz.score,
    status: quiz.status,
    category: quiz.category,
    difficulty: quiz.difficulty,
    createdAt: quiz.created_at,
  };

  if (quiz.time_limit) {
    response.timeLimit = quiz.time_limit;
    if (quiz.started_at && quiz.status === "active") {
      const elapsed = Math.floor((Date.now() - new Date(quiz.started_at).getTime()) / 1000);
      response.timeRemaining = Math.max(0, quiz.time_limit - elapsed);
    }
  }

  if (quiz.status === "active") {
    response.question = getQuestionByOrder(db, quiz.id, quiz.current_index);
  }

  res.json({ success: true, data: response });
});

/**
 * @swagger
 * /quizzes/{quizId}/answer:
 *   post:
 *     summary: Submit an answer for the current question
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswerBody'
 *     responses:
 *       200:
 *         description: Answer submitted
 *       400:
 *         description: Quiz already completed or invalid option
 *       404:
 *         description: Quiz not found
 */
router.post("/:quizId/answer", validateSubmitAnswer, (req, res, next) => {
  const db = getConnection();
  const { quizId } = req.params;
  const { optionId, timeSpent } = req.body;

  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!quiz) {
    return next(new AppError("Quiz not found", 404));
  }

  if (quiz.status === "completed") {
    return next(new AppError("Quiz is already completed", 400));
  }

  if (quiz.time_limit && quiz.started_at) {
    const elapsed = Math.floor((Date.now() - new Date(quiz.started_at).getTime()) / 1000);
    if (elapsed >= quiz.time_limit) {
      db.prepare(
        "UPDATE quizzes SET status = 'completed', completed_at = datetime('now') WHERE id = ?"
      ).run(quizId);
      return next(new AppError("Time is up! Quiz has been automatically completed.", 400));
    }
  }

  const currentQQ = db
    .prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? AND question_order = ?")
    .get(quizId, quiz.current_index);

  if (!currentQQ) {
    return next(new AppError("No more questions available", 400));
  }

  if (currentQQ.selected_option_id !== null) {
    return next(new AppError("This question has already been answered", 400));
  }

  const selectedOption = db
    .prepare("SELECT * FROM options WHERE id = ? AND question_id = ?")
    .get(Number(optionId), currentQQ.question_id);

  if (!selectedOption) {
    return next(new AppError("Invalid option for this question", 400));
  }

  const isCorrect = selectedOption.is_correct === 1;
  const correctOption = db
    .prepare("SELECT id, option_text FROM options WHERE question_id = ? AND is_correct = 1")
    .get(currentQQ.question_id);

  db.transaction(() => {
    db.prepare(
      "UPDATE quiz_questions SET selected_option_id = ?, is_correct = ?, time_spent = ?, answered_at = datetime('now') WHERE id = ?"
    ).run(Number(optionId), isCorrect ? 1 : 0, timeSpent != null ? Number(timeSpent) : null, currentQQ.id);

    const newScore = quiz.score + (isCorrect ? 1 : 0);
    const newIndex = quiz.current_index + 1;
    const isLastQuestion = newIndex >= quiz.total_questions;

    if (isLastQuestion) {
      db.prepare(
        "UPDATE quizzes SET score = ?, current_index = ?, status = 'completed', completed_at = datetime('now') WHERE id = ?"
      ).run(newScore, newIndex, quizId);
    } else {
      db.prepare("UPDATE quizzes SET score = ?, current_index = ? WHERE id = ?").run(
        newScore,
        newIndex,
        quizId
      );
    }
  })();

  const updatedQuiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);

  const response = {
    isCorrect,
    correctAnswer: {
      id: correctOption.id,
      optionText: correctOption.option_text,
    },
    score: updatedQuiz.score,
    currentQuestion: updatedQuiz.current_index + 1,
    totalQuestions: updatedQuiz.total_questions,
    status: updatedQuiz.status,
  };

  if (updatedQuiz.time_limit && updatedQuiz.started_at && updatedQuiz.status === "active") {
    const elapsed = Math.floor((Date.now() - new Date(updatedQuiz.started_at).getTime()) / 1000);
    response.timeRemaining = Math.max(0, updatedQuiz.time_limit - elapsed);
  }

  if (updatedQuiz.status === "active") {
    response.nextQuestion = getQuestionByOrder(db, quizId, updatedQuiz.current_index);
  }

  res.json({ success: true, data: response });
});

/**
 * @swagger
 * /quizzes/{quizId}/score:
 *   get:
 *     summary: Get the final score and detailed results
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz score and results
 *       400:
 *         description: Quiz not yet completed
 *       404:
 *         description: Quiz not found
 */
router.get("/:quizId/score", (req, res, next) => {
  const db = getConnection();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.quizId);

  if (!quiz) {
    return next(new AppError("Quiz not found", 404));
  }

  if (quiz.status !== "completed") {
    return next(new AppError("Quiz is not yet completed. Answer all questions first.", 400));
  }

  const answers = db
    .prepare(
      `SELECT qq.question_order, qq.is_correct, qq.selected_option_id, qq.time_spent,
              q.question_text,
              so.option_text as selected_option_text,
              co.id as correct_option_id, co.option_text as correct_option_text
       FROM quiz_questions qq
       JOIN questions q ON qq.question_id = q.id
       LEFT JOIN options so ON qq.selected_option_id = so.id
       JOIN options co ON co.question_id = q.id AND co.is_correct = 1
       WHERE qq.quiz_id = ?
       ORDER BY qq.question_order`
    )
    .all(req.params.quizId);

  const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
  const totalTimeSpent = answers.reduce((sum, a) => sum + (a.time_spent || 0), 0);

  const responseData = {
    quizId: quiz.id,
    score: quiz.score,
    totalQuestions: quiz.total_questions,
    percentage,
    status: quiz.status,
    category: quiz.category,
    difficulty: quiz.difficulty,
    createdAt: quiz.created_at,
    completedAt: quiz.completed_at,
    results: answers.map((a) => ({
      questionNumber: a.question_order + 1,
      questionText: a.question_text,
      isCorrect: Boolean(a.is_correct),
      selectedAnswer: a.selected_option_text,
      correctAnswer: a.correct_option_text,
      timeSpent: a.time_spent,
    })),
  };

  if (quiz.time_limit) {
    responseData.timeLimit = quiz.time_limit;
  }
  responseData.totalTimeSpent = totalTimeSpent;

  res.json({ success: true, data: responseData });
});

/**
 * Helper: retrieves a question at a specific order within a quiz.
 * Options are shuffled to prevent pattern memorization.
 */
const getQuestionByOrder = (db, quizId, order) => {
  const qq = db
    .prepare(
      `SELECT q.id, q.question_text, q.category, q.difficulty
       FROM quiz_questions qq
       JOIN questions q ON qq.question_id = q.id
       WHERE qq.quiz_id = ? AND qq.question_order = ?`
    )
    .get(quizId, order);

  if (!qq) return null;

  const options = db
    .prepare("SELECT id, option_text FROM options WHERE question_id = ?")
    .all(qq.id);

  return {
    id: qq.id,
    questionText: qq.question_text,
    category: qq.category,
    difficulty: qq.difficulty,
    options: shuffleArray(options).map((o) => ({
      id: o.id,
      optionText: o.option_text,
    })),
  };
};

module.exports = router;
