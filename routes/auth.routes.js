const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const bcrypt = require("bcrypt");

// Sign up routes
router.get("/sign-up", (req, res) => {
  res.render("auth/sign-up.ejs");
});

router.post("/sign-up", async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;
  const userInDatabase = await User.findOne({
    username: username,
    email: email,
  });
  if (userInDatabase) {
    return res.send("Username or email already taken.");
  }

  if (password !== confirmPassword) {
    return res.send("Password and Confirm Password must match");
  }
  if (req.body.role === "photographer") {
    if (!req.body.address) {
      return res.send("Address is required for photographers.");
    }
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  req.body.password = hashedPassword;

  // validation logic

  const user = await User.create(req.body);
  res.redirect("/auth/sign-in");
});

// Sign in routes
router.get("/sign-in", (req, res) => {
  res.render("auth/sign-in.ejs");
});

router.post("/sign-in", async (req, res) => {
  // First, get the user from the database
  const userInDatabase = await User.findOne({
    username: req.body.username,
    //email: req.body.email,
  });
  if (!userInDatabase) {
    return res.send("Login failed. Please try again.");
  }

  // There is a user! Time to test their password with bcrypt
  const validPassword = bcrypt.compareSync(
    req.body.password,
    userInDatabase.password,
  );
  if (!validPassword) {
    return res.send("Login failed. Please try again.");
  }

  // There is a user AND they had the correct password. Time to make a session!
  // Avoid storing the password, even in hashed format, in the session
  // If there is other data you want to save to `req.session.user`, do so here!
  req.session.user = {
    username: userInDatabase.username,
    _id: userInDatabase._id,
    role: userInDatabase.role,
  };
  if (userInDatabase.role === "photographer") {
    res.redirect("/photographer/dashboard");
  }
  if (userInDatabase.role === "admin") {
    res.redirect("/admin/dashboard");
  }
  if (userInDatabase.role === "user") {
    res.redirect("/");
  }
});

router.get("/sign-out", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
