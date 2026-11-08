const router = require("express").Router();
const Listing = require("../models/Listing");
const Blog = require("../models/Blog");

router.get("/", async (req, res) => {
  if (!req.session.user) return res.render("home/welcome.ejs");

  const listings = await Listing.find().populate("owner").sort({ createdAt: -1 });
  const blogs = await Blog.find()
    .populate("owner listing")
    .sort({ createdAt: -1 });
  res.render("home/homepage.ejs", { listings, blogs, page: "home" });
});
module.exports = router;
