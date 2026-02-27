const { Router } = require("express");
const { getConnection } = require("../database/connection");
const { AppError } = require("../middleware/errorHandler");
const { validateCreateQuestion, validateUpdateQuestion } = require("../middleware/validate");

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         optionText:
 *           type: string
 *           example: "Hyper Text Markup Language"
 *         isCorrect:
 *           type: boolean
 *           example: true
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         questionText:
 *           type: string
 *           example: "What does HTML stand for?"
 *         category:
 *           type: string
 *           example: "web"
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: "easy"
 *         createdAt:
 *           type: string
 *           example: "2026-01-01 12:00:00"
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
 *     CreateQuestionBody:
 *       type: object
 *       required:
 *         - questionText
 *         - options
 *       properties:
 *         questionText:
 *           type: string
 *           example: "What does API stand for?"
 *         category:
 *           type: string
 *           enum: [general, web, javascript, computer-science, database]
 *           example: "web"
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: "medium"
 *         options:
 *           type: array
 *           minItems: 2
 *           maxItems: 6
 *           items:
 *             type: object
 *             required:
 *               - optionText
 *               - isCorrect
 *             properties:
 *               optionText:
 *                 type: string
 *                 example: "Application Programming Interface"
 *               isCorrect:
 *                 type: boolean
 *                 example: true
 */

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of questions
 */
router.get("/", (req, res) => {
  const db = getConnection();
  const { category, difficulty, page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push("q.category = ?");
    params.push(category);
  }
  if (difficulty) {
    conditions.push("q.difficulty = ?");
    params.push(difficulty);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM questions q ${whereClause}`)
    .get(...params).count;

  const questions = db
    .prepare(
      `SELECT q.id, q.question_text, q.category, q.difficulty, q.created_at
       FROM questions q ${whereClause}
       ORDER BY q.id
       LIMIT ? OFFSET ?`
    )
    .all(...params, Number(limit), offset);

  const getOptions = db.prepare(
    "SELECT id, option_text, is_correct FROM options WHERE question_id = ?"
  );

  const result = questions.map((q) => ({
    id: q.id,
    questionText: q.question_text,
    category: q.category,
    difficulty: q.difficulty,
    createdAt: q.created_at,
    options: getOptions.all(q.id).map((o) => ({
      id: o.id,
      optionText: o.option_text,
      isCorrect: Boolean(o.is_correct),
    })),
  }));

  res.json({
    success: true,
    data: result,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @swagger
 * /questions/search:
 *   get:
 *     summary: Search questions by text
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 */
router.get("/search", (req, res, next) => {
  const db = getConnection();
  const { q, category, difficulty, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length === 0) {
    return next(new AppError("Search query (q) is required", 400));
  }

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ["q.question_text LIKE ?"];
  const params = [`%${q.trim()}%`];

  if (category) {
    conditions.push("q.category = ?");
    params.push(category);
  }
  if (difficulty) {
    conditions.push("q.difficulty = ?");
    params.push(difficulty);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM questions q ${whereClause}`)
    .get(...params).count;

  const questions = db
    .prepare(
      `SELECT q.id, q.question_text, q.category, q.difficulty, q.created_at
       FROM questions q ${whereClause}
       ORDER BY q.id
       LIMIT ? OFFSET ?`
    )
    .all(...params, Number(limit), offset);

  const getOptions = db.prepare(
    "SELECT id, option_text, is_correct FROM options WHERE question_id = ?"
  );

  const result = questions.map((q) => ({
    id: q.id,
    questionText: q.question_text,
    category: q.category,
    difficulty: q.difficulty,
    createdAt: q.created_at,
    options: getOptions.all(q.id).map((o) => ({
      id: o.id,
      optionText: o.option_text,
      isCorrect: Boolean(o.is_correct),
    })),
  }));

  res.json({
    success: true,
    data: result,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Get a single question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question found
 *       404:
 *         description: Question not found
 */
router.get("/:id", (req, res, next) => {
  const db = getConnection();
  const question = db
    .prepare("SELECT id, question_text, category, difficulty, created_at FROM questions WHERE id = ?")
    .get(req.params.id);

  if (!question) {
    return next(new AppError("Question not found", 404));
  }

  const options = db
    .prepare("SELECT id, option_text, is_correct FROM options WHERE question_id = ?")
    .all(question.id);

  res.json({
    success: true,
    data: {
      id: question.id,
      questionText: question.question_text,
      category: question.category,
      difficulty: question.difficulty,
      createdAt: question.created_at,
      options: options.map((o) => ({
        id: o.id,
        optionText: o.option_text,
        isCorrect: Boolean(o.is_correct),
      })),
    },
  });
});

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionBody'
 *     responses:
 *       201:
 *         description: Question created
 *       400:
 *         description: Validation error
 */
router.post("/", validateCreateQuestion, (req, res) => {
  const db = getConnection();
  const { questionText, category = "general", difficulty = "medium", options } = req.body;

  const insertQuestion = db.prepare(
    "INSERT INTO questions (question_text, category, difficulty) VALUES (?, ?, ?)"
  );
  const insertOption = db.prepare(
    "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)"
  );

  const result = db.transaction(() => {
    const { lastInsertRowid } = insertQuestion.run(questionText.trim(), category, difficulty);

    const createdOptions = options.map((opt) => {
      const { lastInsertRowid: optId } = insertOption.run(
        lastInsertRowid,
        opt.optionText.trim(),
        opt.isCorrect ? 1 : 0
      );
      return { id: Number(optId), optionText: opt.optionText, isCorrect: Boolean(opt.isCorrect) };
    });

    return {
      id: Number(lastInsertRowid),
      questionText: questionText.trim(),
      category,
      difficulty,
      options: createdOptions,
    };
  })();

  res.status(201).json({ success: true, data: result });
});

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Update a question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionBody'
 *     responses:
 *       200:
 *         description: Question updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Question not found
 */
router.put("/:id", validateUpdateQuestion, (req, res, next) => {
  const db = getConnection();
  const { id } = req.params;
  const { questionText, category, difficulty, options } = req.body;

  const existing = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
  if (!existing) {
    return next(new AppError("Question not found", 404));
  }

  const result = db.transaction(() => {
    const updatedText = questionText ? questionText.trim() : existing.question_text;
    const updatedCategory = category || existing.category;
    const updatedDifficulty = difficulty || existing.difficulty;

    db.prepare(
      "UPDATE questions SET question_text = ?, category = ?, difficulty = ? WHERE id = ?"
    ).run(updatedText, updatedCategory, updatedDifficulty, id);

    let updatedOptions;
    if (options) {
      db.prepare("DELETE FROM options WHERE question_id = ?").run(id);
      const insertOption = db.prepare(
        "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)"
      );
      updatedOptions = options.map((opt) => {
        const { lastInsertRowid } = insertOption.run(id, opt.optionText.trim(), opt.isCorrect ? 1 : 0);
        return { id: Number(lastInsertRowid), optionText: opt.optionText.trim(), isCorrect: Boolean(opt.isCorrect) };
      });
    } else {
      updatedOptions = db
        .prepare("SELECT id, option_text, is_correct FROM options WHERE question_id = ?")
        .all(id)
        .map((o) => ({ id: o.id, optionText: o.option_text, isCorrect: Boolean(o.is_correct) }));
    }

    return {
      id: Number(id),
      questionText: updatedText,
      category: updatedCategory,
      difficulty: updatedDifficulty,
      options: updatedOptions,
    };
  })();

  res.json({ success: true, data: result });
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question deleted
 *       404:
 *         description: Question not found
 */
router.delete("/:id", (req, res, next) => {
  const db = getConnection();
  const question = db.prepare("SELECT id FROM questions WHERE id = ?").get(req.params.id);

  if (!question) {
    return next(new AppError("Question not found", 404));
  }

  db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);

  res.json({ success: true, message: "Question deleted successfully" });
});

module.exports = router;
