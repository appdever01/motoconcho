const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },

  language: {
    type: String,
    required: true,
  },
  banned: { type: Boolean, default: false },
  isDriver: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const driverSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  language: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  ticket: {
    type: Number,
    required: true,
  },

  vehicleName: {
    type: String,
    required: true,
  },
  vehiclePic: {
    type: String,
    required: true,
  },
  plateNumber: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const tripSchema = new mongoose.Schema({
  location: {
    type: [String],
    required: true,
  },

  address: {
    type: String,
    required: true,
  },
  gotDriver: {
    type: Boolean,
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
  driverId: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  driverPhone: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
const Driver = mongoose.model("Drivers", driverSchema);
const Trip = mongoose.model("Trip", tripSchema);

module.exports = { User, Trip, Driver };
