const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: { users: users }
  });
  //next();
});

exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { user }
  });
};

exports.createUser = async (req, res, next) => {
  const newUser = await User.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
};
exports.updateUser = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!user) {
    return next(new AppError('No user found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
};

exports.deleteUser = async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('No user found with that id', 204));
  res.status(204).json({
    status: 'success',
    data: {
      user
    }
  });
};
