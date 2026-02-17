const rateLimit = require("express-rate-limit");

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive routes (like login/sales)
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many sensitive requests. Slow down."
  }
});

module.exports = { apiLimiter, strictLimiter };
