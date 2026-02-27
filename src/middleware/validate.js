const { AppError } = require("./errorHandler");

const VALID_CATEGORIES = ["general", "web", "javascript", "computer-science", "database"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const validateStartQuiz = (req, _res, next) => {
  const { totalQuestions, category, difficulty } = req.body;

  if (totalQuestions !== undefined) {
    const num = Number(totalQuestions);
    if (!Number.isInteger(num) || num < 1 || num > 50) {
      return next(new AppError("totalQuestions must be an integer between 1 and 50", 400));
    }
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return next(
      new AppError(`Invalid category. Valid options: ${VALID_CATEGORIES.join(", ")}`, 400)
    );
  }

  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    return next(
      new AppError(`Invalid difficulty. Valid options: ${VALID_DIFFICULTIES.join(", ")}`, 400)
    );
  }

  next();
};

const validateSubmitAnswer = (req, _res, next) => {
  const { optionId } = req.body;

  if (optionId === undefined || optionId === null) {
    return next(new AppError("optionId is required", 400));
  }

  if (!Number.isInteger(Number(optionId))) {
    return next(new AppError("optionId must be a valid integer", 400));
  }

  next();
};

const validateCreateQuestion = (req, _res, next) => {
  const { questionText, options, category, difficulty } = req.body;

  if (!questionText || typeof questionText !== "string" || questionText.trim().length < 5) {
    return next(new AppError("questionText is required and must be at least 5 characters", 400));
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    return next(new AppError("options must be an array with 2 to 6 items", 400));
  }

  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    return next(new AppError("Exactly one option must be marked as correct", 400));
  }

  for (const opt of options) {
    if (!opt.optionText || typeof opt.optionText !== "string" || opt.optionText.trim().length < 1) {
      return next(new AppError("Each option must have a valid optionText", 400));
    }
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return next(
      new AppError(`Invalid category. Valid options: ${VALID_CATEGORIES.join(", ")}`, 400)
    );
  }

  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    return next(
      new AppError(`Invalid difficulty. Valid options: ${VALID_DIFFICULTIES.join(", ")}`, 400)
    );
  }

  next();
};

module.exports = {
  validateStartQuiz,
  validateSubmitAnswer,
  validateCreateQuestion,
  VALID_CATEGORIES,
  VALID_DIFFICULTIES,
};
