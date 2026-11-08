const router = require("express").Router();
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const multer = require("multer");
const Listing = require("../models/Listing");
const Cart = require("../models/Cart");
const Blog = require("../models/Blog");
const checkRole = require("../middleware/check-role");

const MAX_FILES = 10;
const uploadDirectory = path.join(__dirname, "..", "public", "uploads");
const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, done) => {
      done(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes[extension] || file.mimetype !== allowedTypes[extension]) {
      const error = new Error("Unsupported uploaded file type.");
      error.code = "UNSUPPORTED_UPLOAD_TYPE";
      return done(error);
    }
    done(null, true);
  },
});
const uploadListingMedia = upload.array("image", MAX_FILES);

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

function getReturnPath(req, fallback) {
  const back = req.body.back;
  if (typeof back === "string" && back.startsWith("/") && !back.startsWith("//")) {
    try {
      const url = new URL(back, "http://local.invalid");
      if (url.origin === "http://local.invalid") {
        return url.pathname + url.search + url.hash;
      }
    } catch {}
  }

  const referer = req.get("Referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const requestHost = req.get("Host");
      if (requestHost && url.host.toLowerCase() === requestHost.toLowerCase()) {
        return url.pathname + url.search + url.hash;
      }
    } catch {}
  }
  return fallback;
}

function mediaForListing(listing) {
  if (listing.media.length) return listing.media;
  return [{ url: listing.image, type: "image" }];
}

function toMedia(files) {
  return files.map((file) => ({
    url: "/uploads/" + file.filename,
    type: [".mp4", ".webm"].includes(path.extname(file.filename))
      ? "video"
      : "image",
  }));
}

function coverOf(media) {
  const photo = media.find((file) => file.type === "image");
  return photo ? photo.url : "/images/camera.jpg";
}

async function getListingFiles(listing) {
  const media = mediaForListing(listing);
  return media.map((file) => file.url);
}

router.get("/new", checkRole("photographer"), (req, res) => {
  res.render("listings/create-listing.ejs");
});

router.post(
  "/",
  checkRole("photographer"),
  uploadListingMedia,
  async (req, res) => {
    const files = req.files || [];
    if (!files.length) {
      return res.send("Choose at least one photo or video.");
    }

    const media = toMedia(files);
    try {
      await Listing.create({
        title: req.body.title,
        image: coverOf(media),
        media,
        description: req.body.description,
        price: req.body.price,
        owner: req.session.user._id,
      });
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
    res.redirect("/");
  },
);

router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) return res.send("Listing not found.");
  listing.media = mediaForListing(listing);
  res.render("listings/listing-detail.ejs", { listing });
});

router.get("/:id/edit", checkRole("photographer"), async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return res.send("Your listing was not found.");
  res.render("listings/listing-edit.ejs", { listing });
});

router.put(
  "/:id",
  checkRole("photographer"),
  uploadListingMedia,
  async (req, res) => {
    const files = req.files || [];
    const listing = await Listing.findOne({
      _id: req.params.id,
      owner: req.session.user._id,
    });
    if (!listing) {
      await removeUploadedFiles(files);
      return res.send("Your listing was not found.");
    }

    const hasLegacyImage = !listing.media.length && Boolean(listing.image);
    const oldMedia = mediaForListing(listing);
    const removeIds = [].concat(req.body.removeMedia || []);
    const removedMedia = oldMedia.filter(
      (file) =>
        (file._id && removeIds.includes(file._id.toString())) ||
        (hasLegacyImage && removeIds.includes("legacy-image")),
    );
    const media =
      hasLegacyImage && removeIds.includes("legacy-image")
        ? []
        : oldMedia.filter(
            (file) => !file._id || !removeIds.includes(file._id.toString()),
          );
    media.push(...toMedia(files));
    if (!media.length || media.length > MAX_FILES) {
      await removeUploadedFiles(files);
      return res.send("Keep between 1 and " + MAX_FILES + " photos or videos.");
    }

    listing.media = media;
    listing.image = coverOf(media);
    listing.title = req.body.title;
    listing.description = req.body.description;
    listing.price = req.body.price;
    try {
      await listing.save();
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }

    await removeUploadedPaths(removedMedia.map((file) => file.url));
    res.redirect("/listings/" + listing._id);
  },
);

router.delete("/:id", checkRole("photographer"), async (req, res) => {
  const listing = await Listing.findOneAndDelete({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return res.send("Your listing was not found.");
  const mediaPaths = await getListingFiles(listing);
  await Cart.updateMany({}, { $pull: { listings: listing._id } });
  await Blog.updateMany({ listing: listing._id }, { $set: { listing: null } });
  await removeUploadedPaths(mediaPaths);
  res.redirect("/auth/profile");
});

router.post("/:id/favorite", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.send("Listing not found.");
  const userId = req.session.user._id;
  const alreadyFavorited = listing.favBy.some((id) => id.equals(userId));
  await Listing.updateOne(
    { _id: listing._id },
    alreadyFavorited
      ? { $pull: { favBy: userId } }
      : { $addToSet: { favBy: userId } },
  );
  res.redirect(getReturnPath(req, "/#listings"));
});

module.exports = router;
