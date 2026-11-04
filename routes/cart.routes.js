const express = require("express");
const router = express.Router();
const User = require("../models/Cart.js");

router.get("/", async (req, res) => {
  const userId = req.session.user._id;
  const userCart = await User.findOne({ owner: userId }).populate("listings");
  const cartItems = userCart ? userCart.listings : [];
  res.render("cart/cart.ejs", { cartItems });
});
router.post("/add/:listingId", async (req, res) => {
  const userId = req.session.user._id;
  const listingId = req.params.listingId;

  let userCart = await User.findOne({ owner: userId });
  if (!userCart) {
    userCart = new User({ owner: userId, listings: [] });
  }
  userCart.listings.push(listingId);
  await userCart.save();
  res.redirect("/cart");
});
module.exports = router;
