const formatSequelizeError = require("../utils/errorHandler");

const globalErrorHandler = (err, req, res, next) => {
  // Rollback transaction if available
  if (req.transaction) {
    req.transaction.rollback();
  }

  // Format Sequelize or generic errors
  const formattedError = formatSequelizeError(err);

  res.status(formattedError.statusCode).json(formattedError);
};

module.exports = globalErrorHandler;