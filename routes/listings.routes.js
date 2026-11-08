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
    description: req.body.description,
    price: req.body.price,
    owner: req.session.user._id,
  });
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

router.put("/:id", checkRole("photographer"), async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!listing) return res.send("Your listing was not found.");

  listing.title = req.body.title;
  listing.image = req.body.image;
  listing.description = req.body.description;
  listing.price = req.body.price;
  await listing.save();
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
  res.redirect("/auth/profile");
});

router.post("/:id/favorite", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.send("Listing not found.");
  const alreadyFavorited = listing.favBy.some((id) =>
    id.equals(req.session.user._id),
  );
  await Listing.findByIdAndUpdate(
    listing._id,
    alreadyFavorited
      ? { $pull: { favBy: req.session.user._id } }
      : { $addToSet: { favBy: req.session.user._id } },
  );
  const back = req.body.back;
  res.redirect(
    typeof back === "string" && back.startsWith("/") && !back.startsWith("//")
      ? back
      : "/#listings",
  );
});

module.exports = router;
