class ValidationError extends Error {
  constructor(code, field) {
    super(code);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.status = 400;
  }
}

function toHttpError(error) {
  if (error instanceof ValidationError) {
    return {
      status: error.status,
      body: {
        success: false,
        error: { code: error.code, field: error.field }
      }
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: { code: 'INTERNAL_ERROR' }
    }
  };
}

module.exports = { ValidationError, toHttpError };
