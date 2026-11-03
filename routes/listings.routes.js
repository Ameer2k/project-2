const router = require("express").Router();
const isSignedIn = require("../middleware/is-signed-in");
const Listing = require("../models/Listing");

// Create routes

router.get("/new", isSignedIn, (req, res) => {
  res.render("listings/create-listing.ejs");
});

router.post("/", isSignedIn, async (req, res) => {
  const {} = req.body; // Destructuring
  const createdListing = await Listing.create({
    owner: req.session.user._id,
  });
  res.redirect("/listings");
});

router.get("/", isSignedIn, async (req, res) => {
  const allListings = await Listing.find().populate("owner");
  res.render("listings/index.ejs", { listings: allListings });
});

router.get("/:listingId", isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate(
    "owner",
  );

  console.log(foundListing.favoritedByUsers);

  console.log(
    foundListing.favoritedByUsers.find((oneFavoriteId) => {
      return oneFavoriteId.equals(req.session.user._id);
    }),
  );

  res.render("listings/details.ejs", { listing: foundListing });
});

router.delete("/:listingId", isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId);
  if (!foundListing.owner.equals(req.session.user._id)) {
    return res.send("Action not allowed");
  }
  await Listing.findByIdAndDelete(req.params.listingId);
  res.redirect("/listings");
});

router.post("/:listingId/favorite", isSignedIn, async (req, res) => {
  const updatedListing = await Listing.findByIdAndUpdate(req.params.listingId, {
    $push: { favoritedByUsers: req.session.user._id },
  });

  res.redirect("/listings/" + updatedListing._id);
});

router.post("/:listingId/unfavorite", isSignedIn, async (req, res) => {
  const updatedListing = await Listing.findByIdAndUpdate(req.params.listingId, {
    $pull: { favoritedByUsers: req.session.user._id },
  });

  res.redirect("/listings/" + updatedListing._id);
});

router.get("/my-listings", isSignedIn, async (req, res) => {
  const myListings = await Listing.find({ owner: req.session.user._id });
});

module.exports = router;
