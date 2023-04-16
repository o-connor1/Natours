const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}:${err.value}.`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = err => {
  const value = err.keyValue.name.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another field value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data.${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please login again!', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired.Please login again!', 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational,trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  //   Programming or other unknown error: don't leak error details
  else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};
module.exports = (err, req, res, next) => {
  err.status = err.status || 'fail';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    sendErrorProd(error, res);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  }
};
// express identifies middleware function which has four arguments as error
// // handling middleware function
