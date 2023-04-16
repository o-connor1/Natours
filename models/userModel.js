const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// it basically adds some random string to password in order to encrypt it
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true, //this will convert every uppercase alphabet to lowercase
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: [8, 'Password must contains atleast 8 characters'],
    select: false //means this field (password) will not be shown in get request
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // validator only works for SAVE and CREATE method so for updating ,signing in we are gonna use SAVE method
      //   this function is just checking whether password and passwordConfirm are same or not
      validator: function(el) {
        return this.password === el;
      },
      message: 'Passwords are not same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  // here this has access to current document
  this.password = await bcrypt.hash(this.password, 12);
  //   12 is cost parameter/salt which tells how strong the password is encrypted
  // more the cost more time will be taken to encrypt
  this.passwordConfirm = undefined; //there is no need for passwordConfirm to save it in database
  //   it's only use is to just validate password check
  next();
});
//this document middleware function only run when password was modified

userSchema.pre('save', function(next) {
  if (!this.isModified || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// //Instance method=> implementing here because this method is available over all document
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  // if user has changed their password
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, //getting timestamp in milliseconds so converting in seconds
      10 //base
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
  // false means not changed
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // here we are creating our token with 32 number of characters
  // and converting it into hexadecimal string
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //in milliseconds which is basically 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
