const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

// here we are creating a middleware function which is router and we want to use this middleware for
// that specified route('/api/v1/tours').

// router.param('id', tourController.checkId);
// this is param middleware

// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(tourController.checkBody, tourController.createTour);
// chaining of two middleware(tourController.checkBody,tourController.createTour).
// tourRouter middleware already runs at route '/api/v1/tours' so '/' means that our tourRouter is
// already at that specified route and this process is called mounting of router
// for this specified route ,get and post  method will work so if we want to change route
// then we only have to change it once but while for separate CRUD method we had to
// change that specified route for every CRUD operation which was not much efficient

// router
//   .route('/:id')
//   .get(tourController.getTour)
//   .patch(tourController.updateTour)
//   .delete(tourController.deleteTour);
