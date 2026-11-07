const router = require("express").Router();
const Cart = require("../models/Cart");
const Listing = require("../models/Listing");
const Order = require("../models/Order");
const checkRole = require("../middleware/check-role");

// Get the cart for the signed-in user
router.get("/", async (req, res) => {
  const userId = req.session.user._id;
  const userCart = await User.findOne({ owner: userId }).populate("listings");
  const cartItems = userCart ? userCart.listings : [];
  res.render("cart/cart.ejs", { cartItems });
});

// Add a listing to the cart for the signed-in user
router.post("/add/:listingId", async (req, res) => {
  const userId = req.session.user._id;
  const listingId = req.params.listingId;
  // Check if the user already has a cart, if not create one
  let userCart = await User.findOne({ owner: userId });
  if (!userCart) {
    userCart = new User({ owner: userId, listings: [] });
  }
  // Add the listing to the user's cart
  userCart.listings.push(listingId);
  await userCart.save();
  res.redirect("/cart");
});

// Remove a listing from the cart for the signed-in user
router.delete("/remove/:listingId", async (req, res) => {
  const userId = req.session.user._id;
  const listingId = req.params.listingId;
  // Find the user's cart and remove the listing
  let userCart = await User.findOne({ owner: userId });
  if (userCart) {
    userCart.listings = userCart.listings.filter(
      (id) => id.toString() !== listingId,
    );
    await userCart.save();
  }
  res.redirect("/cart");
});

module.exports = router;
