const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
// we are using this middleware function in order to get top 5 cheap tours by setting values
exports.getAllTours = catchAsync(async (req, res) => {
  // console.log(req.query);
  // query is a request object that is populated by request query strings that are found in a URL.
  // These query strings are in key-value form. They start after the question mark in any URL.
  // And if there are more than one, they are separated with the ampersand.

  //  const tours = await Tour.find();
  //  this function will search for every tour in collection for empty argument in find() function

  // const tours = await Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // SEND RESPSONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours: tours }
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // this function will search for tour with specified id in collection for empty argument in find() function

  if (!tour) {
    return next(new AppError('No tour found with that ID!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { tour: tour }
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({ status: 'success', data: { tour: newTour } });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // this function simply update the fields that are different in body
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
});
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID!', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 }
      }
    },
    // Match stage is used to filter/select certain documents
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, //here we want to calculate average for all tours that's why id is null but we can calculate
        // that by group like difficulty and some other stuff AND for that we have to specify that thing in id
        numTours: { $sum: 1 }, //count the number of tours
        numRating: { $sum: '$ratingsQuantity' }, //sum of all ratings
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
      // it allows us to group documents together using accumumlators.
      // example of accumumlators is like to calculate average
    },
    {
      $sort: { avgPrice: 1 } //1 means will sort by avgPrice in ascending order and For descending it should be -1
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }//selecting doucument which are not easy
    // }
  ]);
  // The aggregation pipeline refers to a specific flow of operations
  //  that processes, transforms, and returns results in stages.
  //  In a pipeline, successive operations are informed by the previous result.
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //it will basically deconstruct an array field from the input documents
      // and then output one documents for each element for the array.
      // for remembering purpose it is like 1NF
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
          // this will filter your dates by specified year
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id' //this will add new field with specified value
      }
    },
    {
      $project: {
        _id: 0
      }
      // each of the field in project take two value, either 1 or 0
      // The fields with value 1 will show up and vice-versa
    },
    {
      $sort: { numTourStarts: -1 } //will sort according to number of Tour in descending order
    },
    {
      $limit: 12 //this will show only 12 value
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan: plan
    }
  });
});

// const fs = require('fs');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );
// //  fs.readFileSync will return JSON object and JSON.parse() will convert it into JavaScript object

// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id is:${val}`);
//   const id = req.params.id * 1;
//   // this will convert our id from string to integer

//   if (id > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'Invalid Input' });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res
//       .status(404)
//       .json({ status: 'fail', message: 'Missing name or price' });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   console.log(req.requestTime);
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: { tours: tours }
//   });
// };

// exports.getTour = (req, res) => {
//   console.log(req.params);
//   // req.params is where all our variable in url are stored
//   const id = req.params.id * 1;
//   const tour = tours.find(el => {
//     return el.id === id;
//   });
//   // here we are finding the tour that has their id equal to required id
//   res.status(200).json({ status: 'success', data: { tours: tour } });
// };

// exports.createTour = (req, res) => {
//   // console.log(req.body);
//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);
//   // Object.assign allows us to create new Object by merging two existing object together
//   tours.push(newTour);

//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({ status: 'success', data: { tours: newTour } });

//       // status:201 means created
//     }
//   );
// };

// exports.updateTour = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here...>'
//     }
//   });
// };

// exports.deleteTour = (req, res) => {
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// };
