const mongoose = require("mongoose");

async function connectToDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Database");
}

module.exports = connectToDB;