const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Blog = require("../models/Blog");
const Cart = require("../models/Cart");
const {
  createUploader,
  removeUploadedFiles,
  removeUploadedPaths,
} = require("../middleware/file-uploads.js");

const profileUpload = createUploader(5 * 1024 * 1024, {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}).single("image");

router.get("/me/edit", (req, res) => {
  res.render("auth/edit-profile.ejs");
});

router.put("/me", profileUpload, async (req, res, next) => {
  const profile = await User.findById(req.session.user._id);
  if (!profile) {
    if (req.file) await removeUploadedFiles([req.file]);
    return res.send("Profile not found.");
  }

  const oldProfilePicture = profile.profilePicture;
  profile.firstName = req.body.firstName;
  profile.lastName = req.body.lastName;
  profile.bio = req.body.bio;
  if (req.file) profile.profilePicture = "/uploads/" + req.file.filename;

  try {
    await profile.save();
  } catch (error) {
    if (req.file) await removeUploadedFiles([req.file]);
    throw error;
  }

  Object.assign(req.session.user, {
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    profilePicture: profile.profilePicture,
  });

  req.session.save((error) => {
    if (error) return next(error);

    const cleanup = req.file
      ? removeUploadedPaths([oldProfilePicture])
      : Promise.resolve();
    cleanup.then(() => res.redirect("/auth/profile")).catch(next);
  });
});

router.delete("/me", async (req, res, next) => {
  const userId = req.session.user._id;
  const [profile, listings] = await Promise.all([
    User.findById(userId),
    Listing.find({ owner: userId }),
  ]);
  const listingIds = listings.map((listing) => listing._id);
  const mediaPaths = listings.flatMap((listing) =>
    listing.media.map((file) => file.url),
  );
  const profilePicture = profile && profile.profilePicture;

  await Cart.updateMany({}, { $pull: { listings: { $in: listingIds } } });
  await Blog.updateMany(
    { listing: { $in: listingIds } },
    { $set: { listing: null } },
  );
  await Listing.deleteMany({ owner: userId });
  await Blog.deleteMany({ owner: userId });
  await Cart.deleteMany({ owner: userId });
  await Order.deleteMany({ owner: userId });
  await Listing.updateMany({}, { $pull: { favBy: userId } });
  await Blog.updateMany({}, { $pull: { favBy: userId } });
  await User.findByIdAndDelete(userId);
  await removeUploadedPaths([...mediaPaths, profilePicture]);

  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.send("Profile not found.");
  }

  const profile = await User.findById(req.params.id).select("-password");
  if (!profile) return res.send("Profile not found.");

  const ownProfile = profile._id.equals(req.session.user._id);
  const [listings, blogs] = await Promise.all([
    Listing.find({ owner: profile._id }),
    Blog.find({ owner: profile._id }).populate("listing"),
  ]);

  let favorites = [];
  let favoriteBlogs = [];
  if (ownProfile) {
    favorites = await Listing.find({ favBy: profile._id });
    favoriteBlogs = await Blog.find({ favBy: profile._id }).populate("listing");
  }

  res.render("auth/profile.ejs", {
    profile,
    ownProfile,
    listings,
    blogs,
    favorites,
    favoriteBlogs,
  });
});

module.exports = router;
