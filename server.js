const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT REJECTION! Shutting Down...');
  console.log(err);

  process.exit(1);
});

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_URI.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
// console.log(process.env.NODE_ENV);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DATABASE CONNECTED!');
  });

// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997
// });

// testTour
//   .save() //will save the document to databse
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log(`ERROR :${err}`);
//   });
// // in .then method we get document value as resolve value

// const port = process.env.PORT || 8000;
const port = 8000;
const server = app.listen(port, () => {
  console.log(`App running on the port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting Down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
    // 1 means uncaught exceptions while 0 means success
  });
  // server.close will give time processing/pending request to finish before shutting down abruptly
});
