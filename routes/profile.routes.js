const router = require("express").Router();
const User = require("../models/User");
const Listing = require("../models/Listing");
const Blog = require("../models/Blog");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

router.get("/me/edit", (req, res) => {
  res.render("auth/edit-profile.ejs");
});

router.put("/me", async (req, res) => {
  const profile = await User.findById(req.session.user._id);
  if (!profile) return res.send("Profile not found.");

  profile.firstName = req.body.firstName;
  profile.lastName = req.body.lastName;
  profile.bio = req.body.bio;

  profile.profilePicture = req.body.profilePicture;
  await profile.save();
  req.session.user.firstName = profile.firstName;
  req.session.user.lastName = profile.lastName;
  req.session.user.bio = profile.bio;
  req.session.user.profilePicture = profile.profilePicture;
  res.redirect("/profiles/" + profile._id);
});

router.delete("/me", async (req, res, next) => {
  const id = req.session.user._id;
  const listings = await Listing.find({ owner: id });

  for (const listing of listings) {
    await Cart.updateMany({}, { $pull: { listings: listing._id } });
    await Blog.updateMany(
      { listing: listing._id },
      { $set: { listing: null } },
    );
  }
  await Listing.deleteMany({ owner: id });
  await Blog.deleteMany({ owner: id });
  await Cart.deleteMany({ owner: id });
  await Order.deleteMany({ owner: id });
  await User.updateMany({}, { $pull: { following: id } });
  await Listing.updateMany({}, { $pull: { favBy: id } });
  await Blog.updateMany({}, { $pull: { favBy: id } });
  await User.findByIdAndDelete(id);
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

router.get("/:id", async (req, res) => {
  const profile = await User.findById(req.params.id).select("-password");

  if (!profile) return res.send("Profile not found.");
  const ownProfile = profile._id.equals(req.session.user._id);

  const isFollowing = await User.exists({
    _id: req.session.user._id,
    following: profile._id,
  });

  const listings = await Listing.find({ owner: profile._id });
  const blogs = await Blog.find({ owner: profile._id }).populate("listing");
  const followers = await User.countDocuments({ following: profile._id });
  let favorites = [];
  let favoriteBlogs = [];
  let orders = [];
  let followerUsers = [];
  let followingUsers = [];

  if (ownProfile) {
    followerUsers = await User.find({ following: profile._id }).select(
      "username profilePicture firstName lastName",
    );
    followingUsers = await User.find({
      _id: { $in: profile.following },
    }).select("username profilePicture firstName lastName");
    favorites = await Listing.find({ favBy: profile._id });
    favoriteBlogs = await Blog.find({ favBy: profile._id }).populate("listing");
    if (req.session.user.role === "user")
      orders = await Order.find({ owner: profile._id }).sort({ createdAt: -1 });
  }
  res.render("auth/profile.ejs", {
    profile,
    ownProfile,
    listings,
    blogs,
    followers,
    favorites,
    favoriteBlogs,
    orders,
    isFollowing,
    followerUsers,
    followingUsers,
  });
});

router.post("/:id/follow", async (req, res) => {
  const profile = await User.findById(req.params.id);

  if (!profile) return res.send("Profile not found.");
  const me = await User.findById(req.session.user._id);
  if (!me) return res.send("Profile not found.");

  if (me._id.equals(profile._id)) return res.redirect("/auth/profile");
  if (me.following.includes(profile._id)) {
    await User.findByIdAndUpdate(me._id, { $pull: { following: profile._id } });
  } else {
    await User.findByIdAndUpdate(me._id, {
      $addToSet: { following: profile._id },
    });
  }
  res.redirect("/profiles/" + profile._id);
});

module.exports = router;
