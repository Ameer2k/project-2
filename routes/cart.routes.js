const router = require("express").Router();
const Cart = require("../models/Cart");
const Listing = require("../models/Listing");
const Order = require("../models/Order");
const checkRole = require("../middleware/check-role");

router.use(checkRole("user"));

router.get("/", async (req, res) => {
  const cart = await Cart.findOne({ owner: req.session.user._id }).populate(
    "listings",
  );
  const cartItems = cart ? cart.listings : [];
  res.render("cart/cart.ejs", { cartItems });
});

router.post("/add/:listingId", async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) return res.send("Listing not found.");
  await Cart.updateOne(
    { owner: req.session.user._id },
    { $addToSet: { listings: listing._id } }, // addToSet prevents duplicate packages.
    { upsert: true },
  );
  res.redirect("/cart");
});

router.delete("/remove/:listingId", async (req, res) => {
  await Cart.updateOne(
    { owner: req.session.user._id },
    { $pull: { listings: req.params.listingId } },
  );
  res.redirect("/cart");
});

router.post("/checkout", async (req, res) => {
  const cart = await Cart.findOne({ owner: req.session.user._id }).populate({
    path: "listings",
    populate: { path: "owner" },
  });
  if (!cart || !cart.listings.length) return res.redirect("/cart");

  const items = cart.listings.map((listing) => ({
    title: listing.title,
    image: listing.image,
    price: listing.price,
    photographer: listing.owner ? listing.owner.username : "Deleted account",
  }));
  const total = items.reduce((sum, item) => sum + item.price, 0);

  try {
    await Order.create({ owner: req.session.user._id, items, total });
  } catch (error) {
    await Cart.updateOne(
      { owner: req.session.user._id },
      {
        $setOnInsert: { listings: cart.listings.map((listing) => listing._id) },
      },
      { upsert: true },
    );
    throw error;
  }
  await Cart.deleteOne({ _id: cart._id });
  res.redirect("/auth/profile"); // Cart history is on your profile.
});

module.exports = router;
