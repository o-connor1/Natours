const mongoose = require('mongoose');
const slugify = require('slugify');
// A URL slug (also known as website slug) is the last part of the URL address
//  that serves as a unique identifier of the page.
//  For example, the article you're reading now has a URL that looks like this:
//  https://semrush.com/blog/what-is-a-url-slug/ The URL's slug is “what-is-a-url-slug”.
//  const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    // used to specify schema for our data

    name: {
      type: String, //this specify that the type must be string
      required: [true, 'A tour must have a name'], //true specifies that this attribute is required and on error it will show the meesage which is second element
      unique: true,
      trim: true,
      maxlength: [
        40,
        `A tour's name must be less than or equal to 40 characters`
      ],
      minlength: [
        10,
        `A tour's name must be greater than or equal to 10 characters`
      ]
      // maxlength and minlength are validators that runs only when runValidators is set to true
      // validate: [validator.isAlpha, 'Tour name must only contains character']
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: difficult,medium or easy'
      }
      //enum is a validator that allow user to enter only specified options and is used only for strings
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this only points to current document on NEW document creation.
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String], //contains image's name as an array of string
    createdAt: {
      type: [Date],
      default: Date.now(),
      select: false //this will hide this attribute from the client
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false }
  },
  {
    toJSON: { virtuals: true }, // each time data is outputted in the form of JSON we want virtuals to be part of output
    toObject: { virtuals: true } // each time data is outputted in the form of object we want virtuals to be part of output
  } //this is basically tourSchema options
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; //we are using regular function here because we want to use this keyword in order
  // to access duration and arrow function don't have it's own this keyword
});
// DOCUMENT MIDDLEWARE: runs before .save() and .create() command but not before .insertMany
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  // here this keyword points to currently processed document and we are defining new property to the document
  next();
});

// tourSchema.pre('save', function(next) {
//  console.log("Will save document");
//   next();
// });
// we can use multiple pre and post middleware
// tourSchema.post('save', function(doc, next) {
//   //  doc is processed document after saving
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  // here this keyword points to query object like Tour.find() and then we can chain this query object with other query
  next();
});
// this middleware function will run before every function that starts with find is executed like find,findOne,etc.

tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(doc);
  next();
});
// this middleware function will run after every function that starts with find is executed like find,findOne,etc.
// and it has access to cuurent document

tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // here this keyword refers to current aggregate object
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
