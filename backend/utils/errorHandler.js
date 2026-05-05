const logger = require("./logger");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  logger.error({
    requestId: req.requestId, // tracing
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body,           //  helpful for debugging
    user: req.user?.user_id   //  who caused it
  });

  const isDev = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.requestId, // return to frontend
    ...(isDev && { stack: err.stack }) // only in dev
  });
};