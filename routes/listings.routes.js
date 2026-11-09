const router = require("express").Router();
const Listing = require("../models/Listing");
const Cart = require("../models/Cart");
const Blog = require("../models/Blog");
const checkRole = require("../middleware/check-role");
const {
  createUploader,
  removeUploadedFiles,
  removeUploadedPaths,
} = require("../middleware/file-uploads.js");
const getReturnPath = require("../middleware/return-path");
const maxFiles = 10;
const upload = createUploader(25 * 1024 * 1024, {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}).array("image", maxFiles);

function toMedia(files) {
  return files.map((file) => ({ url: "/uploads/" + file.filename }));
}

router.get("/new", checkRole("photographer"), (req, res) => {
  res.render("listings/create-listing.ejs");
});

router.post("/", checkRole("photographer"), upload, async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.send("Choose at least one image.");

  const media = toMedia(files);
  try {
    await Listing.create({
      title: req.body.title,
      image: media[0].url,
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
});

router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) return res.send("Listing not found.");

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

router.put("/:id", checkRole("photographer"), upload, async (req, res) => {
  const files = req.files || [];
  const listing = await Listing.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });

  if (!listing) {
    await removeUploadedFiles(files);
    return res.send("Your listing was not found.");
  }

  const removeIds = new Set([].concat(req.body.removeMedia || []));
  const removedMedia = listing.media.filter((file) =>
    removeIds.has(file._id.toString()),
  );
  const media = listing.media.filter(
    (file) => !removeIds.has(file._id.toString()),
  );
  media.push(...toMedia(files));

  if (!media.length || media.length > maxFiles) {
    await removeUploadedFiles(files);
    return res.send("Keep between 1 and " + maxFiles + " images.");
  }

  listing.media = media;
  listing.image = media[0].url;
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
});

router.delete("/:id", checkRole("photographer"), async (req, res) => {
  const listing = await Listing.findOneAndDelete({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return res.send("Your listing was not found.");

  await Cart.updateMany({}, { $pull: { listings: listing._id } });
  await Blog.updateMany({ listing: listing._id }, { $set: { listing: null } });
  await removeUploadedPaths(listing.media.map((file) => file.url));
  res.redirect("/auth/profile");
});

router.post("/:id/favorite", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.send("Listing not found.");

  const userId = req.session.user._id;
  const isFavorited = listing.favBy.some((id) => id.equals(userId));
  await Listing.updateOne(
    { _id: listing._id },
    isFavorited
      ? { $pull: { favBy: userId } }
      : { $addToSet: { favBy: userId } },
  );

  res.redirect(getReturnPath(req, "/#listings"));
});

module.exports = router;
