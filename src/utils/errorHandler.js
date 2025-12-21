// Utility to format Sequelize errors
const formatSequelizeError = (err) => {
  if (
    err.name === "SequelizeUniqueConstraintError" ||
    err.name === "SequelizeValidationError"
  ) {
    return {
      statusCode: 400,
      status: "fail",
      errorType: err.name,
      message: "Validation error occurred while processing your request.",
      details: err.errors?.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    };
  }

  // Default unexpected error
  return {
    statusCode: 500,
    status: "error",
    errorType: err.name,
    message: "Unexpected error occurred while processing your request.",
    details: { error: err.message },
  };
};

module.exports = formatSequelizeError;