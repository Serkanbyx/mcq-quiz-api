const { getConnection } = require("./connection");

const hasColumn = (db, table, column) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((col) => col.name === column);
};

const initializeDatabase = () => {
  const db = getConnection();

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0 CHECK(is_correct IN (0, 1)),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      total_questions INTEGER NOT NULL DEFAULT 10,
      current_index INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      category TEXT,
      difficulty TEXT,
      time_limit INTEGER,
      started_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      question_order INTEGER NOT NULL,
      selected_option_id INTEGER,
      is_correct INTEGER,
      time_spent INTEGER,
      answered_at TEXT,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (selected_option_id) REFERENCES options(id)
    );

    CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
  `);

  if (!hasColumn(db, "quizzes", "time_limit")) {
    db.exec("ALTER TABLE quizzes ADD COLUMN time_limit INTEGER");
  }
  if (!hasColumn(db, "quizzes", "started_at")) {
    db.exec("ALTER TABLE quizzes ADD COLUMN started_at TEXT");
  }
  if (!hasColumn(db, "quiz_questions", "time_spent")) {
    db.exec("ALTER TABLE quiz_questions ADD COLUMN time_spent INTEGER");
  }

  return db;
};

module.exports = { initializeDatabase };
