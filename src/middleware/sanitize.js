/**
 * Recursive input sanitizer to prevent XSS attacks.
 * Strips HTML angle brackets and trims whitespace from all string values.
 */
const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(/[<>]/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === "object") {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }

  return value;
};

const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};

module.exports = { sanitizeBody, sanitizeValue };
