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
  if (!listing) return fail(res, "Listing not found.");
  res.render("listings/listing-detail.ejs", { listing });
});

router.get("/:id/edit", async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return fail(res, 404, "Your listing was not found.");
  res.render("listings/listing-edit.ejs", { listing });
});

// Delete a listing by ID
router.delete("/:id", isSignedIn, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing.owner.equals(req.session.user._id)) {
    return res.send("Action not allowed");
  }
  await Listing.findByIdAndDelete(req.params.id);
  res.redirect("/listings");
});

// Update a listing by ID
router.put("/:id", isSignedIn, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing.owner.equals(req.session.user._id)) {
    return res.send("Action not allowed");
  }
  await Listing.findByIdAndUpdate(req.params.id, req.body);
  res.redirect(`/listings/${req.params.id}`);
});

module.exports = router;
