const logger = require("./logger");

module.exports = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
