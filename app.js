const express = require('express');
// this is a function which will add a bunch of methods to aur app variable

const morgan = require('morgan');
// It is a logging middleware to log HTTP requests and errors, and simplifies the process.

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // this morgan middleware function will return function similar to our own custom made middleware function
}

app.use(express.json());
// Here express.json() is middleware and middleware is just a function that modifies the incoming request data

app.use(express.static(`${__dirname}/public`));
// there are some files in our file system that we cannot access through routes so we use built-in
// express middleware

app.use((req, res, next) => {
  // console.log('Hello from the middleware!');
  next();
  // NOTE:Always use next function in middleware function because that next function is what sends your req,res
  // object to the next middleware in stack otherwise it won't be able to send your request-response object further
  // and thus it will not send this object to the client
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // here we are adding current time (time when the request happens) to request object
  next();
});

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
//   // sending response of JSON object
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

// app.get('/api/v1/tours/x?', getAllTours);
// here x is optional parameter
// here we are sending response about tours through GET method
// we usually call the callback function in .get method, route handler

// app.post('/api/v1/tours', createTour);
// Here we want to add data to tours so we are using POST method
// and generally the information about adding data are ideally available in req object
// but here in express, body data does not get stored directly in req Object
// so for accessing that data through req object we have to use middleware

// app.get('/api/v1/tours/:id', getTour);

// app.patch('/api/v1/tours/:id', updateTour);

// app.delete('/api/v1/tours/:id', deleteTour);

//  ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);
  // Express interpret any midddleware function with argument in next function as error
  // and then it skip all middleware function in middleware stack and send that error to error
  // handling middleware function

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// app.all means that this will be applicable to all request methods like get,post,put,patch
// * means that it will be applicable to all route whose handler is not made

app.use(globalErrorHandler);

module.exports = app;
