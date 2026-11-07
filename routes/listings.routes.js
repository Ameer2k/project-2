const router = require("express").Router();
const Listing = require("../models/Listing");
const Cart = require("../models/Cart");
const Blog = require("../models/Blog");
const checkRole = require("../middleware/check-role");

router.get("/new", checkRole("photographer"), (req, res) => {
  res.render("listings/create-listing.ejs");
});

router.post("/", checkRole("photographer"), async (req, res) => {
  await Listing.create({
    title: req.body.title,
    image: req.body.image,
    media,
    description: req.body.description,
    price: req.body.price,
    owner: req.session.user._id,
  });
  res.redirect("/");
});

router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) return "Listing not found.";
  res.render("listings/listing-detail.ejs", { listing });
});

router.get("/:id/edit", async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return "Your listing was not found.";
  res.render("listings/listing-edit.ejs", { listing });
});

router.delete("/:id", async (req, res) => {
  const listing = await Listing.findOneAndDelete({
    _id: req.params.id,
    owner: req.session.user._id,
  });

  if (!listing) return "Your listing was not found.";
  await Cart.updateMany({}, { $pull: { listings: listing._id } });
  await Blog.updateMany({ listing: listing._id }, { $set: { listing: null } });
  res.redirect("/auth/profile");
});

router.post("/:id/favorite", async (req, res) => {
  if (!(await Listing.exists({ _id: req.params.id })))
    return "Listing not found.";
  await (Listing, req.params.id, "favBy", req.session.user._id);
  res.redirect((req, "/#listings"));
});

module.exports = router;
