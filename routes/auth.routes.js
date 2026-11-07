const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const bcrypt = require("bcrypt");

router.get("/sign-up", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("auth/sign-up.ejs");
});
router.get("/sign-in", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("auth/sign-in.ejs");
});
router.get("/profile", (req, res) => {
  res.render("auth/profile.ejs");
});

router.post("/sign-up", async (req, res) => {
  if (req.body.role !== "user" && req.body.role !== "photographer") {
    return res.send("Choose user or photographer.");
  }
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.send("Username, email and password are required.");
  }
  if (
    req.body.password.length < 4 ||
    req.body.password !== req.body.confirmPassword
  ) {
    return res.send("Use matching passwords with at least 4 characters.");
  }

  const foundUser = await User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  });
  if (foundUser) return res.send("Username or email already taken.");
  if (
    req.body.role === "photographer" &&
    (!req.body.businessName || !req.body.address || !req.body.phoneNumber)
  ) {
    return res.send("Fill in the business name, address and phone number.");
  }
  await User.create({
    username: req.body.username,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    role: req.body.role,
    businessName: req.body.businessName,
    address: req.body.address,
    phoneNumber: req.body.phoneNumber,
  });
  res.redirect("/auth/sign-in");
});

router.post("/sign-in", async (req, res, next) => {
  const username = req.body.username || "";
  const foundUser = await User.findOne({ username });
  const passwordMatches =
    foundUser &&
    (await bcrypt.compare(req.body.password || "", foundUser.password));
  if (!passwordMatches) return fail(res, "Username or password is incorrect.");

  // There is a user AND they had the correct password. Time to make a session!
  // Avoid storing the password, even in hashed format, in the session
  // If there is other data you want to save to `req.session.user`, do so here!

  req.session.user = {
    _id: foundUser._id,
    username: foundUser.username,
    role: foundUser.role,
    profilePicture: foundUser.profilePicture,
    firstName: foundUser.firstName,
    lastName: foundUser.lastName,
    bio: foundUser.bio,
  };
  res.redirect("/");
});

router.post("/sign-out", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
