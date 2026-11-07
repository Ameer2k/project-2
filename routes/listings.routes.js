const router = require("express").Router();
const Listing = require("../models/Listing");
const Cart = require("../models/Cart");
const Blog = require("../models/Blog");
const checkRole = require("../middleware/check-role");

router.get("/new", checkRole("photographer"), (req, res) => {
  res.render("listings/create-listing.ejs");
});

// Create a new listing as a signed-in photographer
router.post("/", isSignedIn, async (req, res) => {
  const { title, description, price, image } = req.body;
  console.log(req.body);
  const createdListing = await Listing.create({
    owner: req.session.user._id,
    title,
    description,
    price,
    image,
  });
  res.redirect("/");
});

// Get all listings
router.get("/", async (req, res) => {
  const listings = await Listing.find().populate("owner");
  res.render("listings/all-listings.ejs", { listings });
});

// Get a specific listing by ID
router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  res.render("listings/all-listing-detail.ejs", { listing });
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
