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
  if (!req.session.user) return res.redirect("/auth/sign-in");
  res.redirect("/profiles/" + req.session.user._id);
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

  if (
    req.body.role === "photographer" &&
    (!req.body.businessName || !req.body.address || !req.body.phoneNumber)
  ) {
    return res.send("Fill in the business name, address and phone number.");
  }

  const foundUser = await User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  });
  if (foundUser) return res.send("Username or email already taken.");
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
  if (!passwordMatches) return res.send("Username or password is incorrect.");

  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.user = {
      _id: foundUser._id,
      username: foundUser.username,
      role: foundUser.role,
      profilePicture: foundUser.profilePicture,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      bio: foundUser.bio,
    };
    req.session.save((saveError) => {
      if (saveError) return next(saveError);
      res.redirect("/");
    });
  });
});

router.post("/sign-out", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

module.exports = router;
