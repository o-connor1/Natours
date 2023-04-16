class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    // when new object is created and constructor function is called then it will not appear in stackTrace
    // and thus will not pollute it.
  }
}

module.exports = AppError;
