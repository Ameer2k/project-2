const mongoose = require("mongoose");

async function connectToDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Database");
}

module.exports = connectToDB;
