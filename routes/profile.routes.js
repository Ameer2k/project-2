const router = require("express").Router();
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const mongoose = require("mongoose");
const path = require("node:path");
const multer = require("multer");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Blog = require("../models/Blog");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const PERSON_FIELDS = "username profilePicture firstName lastName";
const uploadDirectory = path.join(__dirname, "..", "public", "uploads");
const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const profileUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, done) => {
      done(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes[extension] || file.mimetype !== allowedTypes[extension]) {
      const error = new Error("Unsupported uploaded file type.");
      error.code = "UNSUPPORTED_UPLOAD_TYPE";
      return done(error);
    }
    done(null, true);
  },
}).single("image");

async function removeUploadedFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      if (!file.filename) return;
      try {
        await fs.unlink(
          path.join(uploadDirectory, path.basename(file.filename)),
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }),
  );
}

async function removeUploadedPaths(paths) {
  const files = paths
    .filter((value) => typeof value === "string" && value.startsWith("/uploads/"))
    .map((value) => ({ filename: path.basename(value) }));
  await removeUploadedFiles(files);
}

function mediaForListing(listing) {
  if (listing.media && listing.media.length) return listing.media;
  return listing.image ? [{ url: listing.image, type: "image" }] : [];
}

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
  if (req.file) {
    profile.profilePicture = "/uploads/" + req.file.filename;
  } else if (typeof req.body.profilePicture === "string") {
    profile.profilePicture = req.body.profilePicture.trim();
  }

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
  const id = req.session.user._id;
  const [profile, myListings] = await Promise.all([
    User.findById(id),
    Listing.find({ owner: id }),
  ]);
  const listingIds = myListings.map((listing) => listing._id);
  const mediaPaths = myListings.flatMap((listing) =>
    mediaForListing(listing).map((file) => file.url),
  );
  const profilePicture = profile && profile.profilePicture;

  await Cart.updateMany({}, { $pull: { listings: { $in: listingIds } } });
  await Blog.updateMany(
    { listing: { $in: listingIds } },
    { $set: { listing: null } },
  );
  await Listing.deleteMany({ owner: id });
  await Blog.deleteMany({ owner: id });
  await Cart.deleteMany({ owner: id });
  await Order.deleteMany({ owner: id });
  await User.updateMany({}, { $pull: { following: id } });
  await Listing.updateMany({}, { $pull: { favBy: id } });
  await Blog.updateMany({}, { $pull: { favBy: id } });
  await User.findByIdAndDelete(id);
  await removeUploadedPaths([...mediaPaths, profilePicture]);

  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

async function loadPrivateData(profile, role) {
  const [followerUsers, followingUsers, favorites, favoriteBlogs, orders] =
    await Promise.all([
      User.find({ following: profile._id }).select(PERSON_FIELDS),
      User.find({ _id: { $in: profile.following } }).select(PERSON_FIELDS),
      Listing.find({ favBy: profile._id }),
      Blog.find({ favBy: profile._id }).populate("listing"),
      role === "user"
        ? Order.find({ owner: profile._id }).sort({ createdAt: -1 })
        : [],
    ]);
  return { followerUsers, followingUsers, favorites, favoriteBlogs, orders };
}

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.send("Profile not found.");
  }
  const profile = await User.findById(req.params.id).select("-password");
  if (!profile) return res.send("Profile not found.");
  const me = req.session.user;
  const ownProfile = profile._id.equals(me._id);

  const [listings, blogs, followers, isFollowing] = await Promise.all([
    Listing.find({ owner: profile._id }),
    Blog.find({ owner: profile._id }).populate("listing"),
    User.countDocuments({ following: profile._id }),
    User.exists({ _id: me._id, following: profile._id }),
  ]);

  const privateData = ownProfile
    ? await loadPrivateData(profile, me.role)
    : {
        followerUsers: [],
        followingUsers: [],
        favorites: [],
        favoriteBlogs: [],
        orders: [],
      };

  res.render("auth/profile.ejs", {
    profile,
    ownProfile,
    listings,
    blogs,
    followers,
    isFollowing,
    ...privateData,
  });
});

router.post("/:id/follow", async (req, res) => {
  const myId = req.session.user._id;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.send("Profile not found.");
  }
  if (String(req.params.id) === String(myId)) {
    return res.redirect("/auth/profile");
  }
  if (!(await User.exists({ _id: req.params.id }))) {
    return res.send("Profile not found.");
  }

  const alreadyFollowing = await User.exists({
    _id: myId,
    following: req.params.id,
  });
  await User.updateOne(
    { _id: myId },
    alreadyFollowing
      ? { $pull: { following: req.params.id } }
      : { $addToSet: { following: req.params.id } },
  );
  res.redirect("/profiles/" + req.params.id);
});

module.exports = router;
