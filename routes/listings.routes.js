const router = require("express").Router();
const isSignedIn = require("../middleware/is-signed-in");
const Listing = require("../models/Listing");

// Create routes
router.get("/new", isSignedIn, (req, res) => {
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
  res.redirect("/listings");
});

// Read routes
router.get("/", isSignedIn, async (req, res) => {
  const allListings = await Listing.find().populate("owner");
  res.render("listings/index.ejs", { listings: allListings });
});

router.delete("/:listingId", isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId);
  if (!foundListing.owner.equals(req.session.user._id)) {
    return res.send("Action not allowed");
  }
  await Listing.findByIdAndDelete(req.params.listingId);
  res.redirect("/listings");
});

module.exports = router;
