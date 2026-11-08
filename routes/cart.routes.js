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
  const wantsJSON = req.get("Accept") === "application/json";
  if (!listing) {
    if (wantsJSON)
      return res.json({
        success: false,
        message: "This listing is no longer available.",
      });
    return res.send("Listing not found.");
  }

  await Cart.findOneAndUpdate(
    { owner: req.session.user._id },
    { $addToSet: { listings: listing._id } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  if (wantsJSON) return res.json({ success: true, message: "Added to cart." });
  const back = req.body.back;
  res.redirect(
    typeof back === "string" && back.startsWith("/") && !back.startsWith("//")
      ? back
      : "/cart",
  );
});

router.delete("/remove/:listingId", async (req, res) => {
  await Cart.updateOne(
    { owner: req.session.user._id },
    { $pull: { listings: req.params.listingId } },
  );
  res.redirect("/cart");
});

router.post("/checkout", async (req, res) => {
  const cart = await Cart.findOne({
    owner: req.session.user._id,
  }).populate({ path: "listings", populate: { path: "owner" } });
  if (!cart || !cart.listings.length) return res.redirect("/cart");

  const items = cart.listings.map((listing) => ({
    title: listing.title,
    image: listing.image,
    price: listing.price,
    photographer: listing.owner ? listing.owner.username : "Deleted account",
  }));
  const total = items.reduce((sum, item) => sum + item.price, 0);

  await Order.create({ owner: req.session.user._id, items, total });
  await Cart.deleteOne({ _id: cart._id });
  res.redirect("/auth/profile#history");
});

module.exports = router;
