class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${statusCode} — ${err.message}`);
    if (!err.isOperational) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { AppError, errorHandler, notFoundHandler };
