const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const isSignedIn = require("../middleware/is-signed-in");

router.get("/sign-up", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("auth/sign-up.ejs");
});

router.post("/sign-up", async (req, res) => {
  const {
    role,
    password,
    confirmPassword,
    businessName,
    address,
    phoneNumber,
  } = req.body;
  const username = (req.body.username || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();

  if (role !== "user" && role !== "photographer") {
    return res.send("Choose user or photographer.");
  }
  if (!username || !email || !password) {
    return res.send("Username, email and password are required.");
  }
  if (password.length < 4 || password !== confirmPassword) {
    return res.send("Use matching passwords with at least 4 characters.");
  }
  if (role === "photographer" && !(businessName && address && phoneNumber)) {
    return res.send("Fill in the business name, address and phone number.");
  }

  const foundUser = await User.findOne({ $or: [{ username }, { email }] });
  if (foundUser) return res.send("Username or email already taken.");

  await User.create({
    username,
    email,
    password: await bcrypt.hash(password, 10), // Hash protects the password.
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    role,
    businessName,
    address,
    phoneNumber,
  });
  res.redirect("/auth/sign-in");
});

router.get("/sign-in", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("auth/sign-in.ejs");
});

router.post("/sign-in", async (req, res, next) => {
  const username = (req.body.username || "").trim();
  const foundUser = await User.findOne({ username });
  const passwordMatches =
    foundUser &&
    (await bcrypt.compare(req.body.password || "", foundUser.password));
  if (!passwordMatches) return res.send("Username or password is incorrect.");

  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.user = {
      _id: foundUser._id.toString(),
      username: foundUser.username,
      role: foundUser.role,
      profilePicture: foundUser.profilePicture,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      bio: foundUser.bio,
    };
    res.redirect("/");
  });
});

router.post("/sign-out", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

router.get("/profile", isSignedIn, (req, res) => {
  res.redirect("/profiles/" + req.session.user._id);
});
router.get("/edit-profile", isSignedIn, (req, res) => {
  res.redirect("/profiles/me/edit");
});

module.exports = router;
