const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  address: {
    type: String,
  },
  role:{
    type: String,
    enum: ['user', 'admin', 'photographer'],
  }
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

module.exports = User;
