const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //   1)check if email and password exists
  if (!email || !password)
    return next(
      new AppError('PLease provide email address and password!', 400)
    );
  // 2)check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  // the findOne function will retrieve data with passed argument in database
  const correct = await user.correctPassword(password, user.password);
  if (!user || !correct)
    return next(new AppError('Incorrect email or password', 401));
  // 3)if everything ok,send token to client
  const token = signToken(user._id);

  return res.status(200).json({
    status: 'success',
    token: token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1)Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // this is checking whether the token has not been manipulated by malicious party

  // 3)check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  // 4) check if user changed password after token was issued
  // iat = issued at time
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again!', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // here we are using rest operator means that roles will be array of argument
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return new AppError(
        'You do not have permission to perform this action.',
        403
      );
    }
    return next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1)) Get users based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with email address', 404));

  // 2))Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // this will deactivate all validators present in our schema

  // 3))Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password ? YOU MOTHERfUCKER. 
  I am sending you link to your email.CLick here: ${resetURL}.
  \n
  If you didn't forgot your paswword then maa chuda`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() } //checking whether password expiry time
    // is greater than current time or not
  });

  // 2) If the token has not expired, there is user, set the new password
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT to user
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token: token
  });

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.correctPassword(req.body.passwordConfirm, user.password))) {
    return next(new AppError('Your password is incorrect!', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token: token
  });
});
