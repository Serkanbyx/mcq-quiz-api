const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

let db = null;

const getConnection = () => {
  if (db) return db;

  const dbPath = path.resolve(process.env.DB_PATH || "./data/quiz.db");
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
};

const closeConnection = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { getConnection, closeConnection };
