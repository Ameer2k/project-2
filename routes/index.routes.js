const Listing = require("../models/Listing.js");
const Blog = require("../models/Blog.js");

const router = require("express").Router();

router.get("/", async (req, res) => {
  if (!req.session.user) return res.render("home/welcome.ejs");

  const listings = await Listing.find()
    .populate("owner")
    .sort({ createdAt: -1 });
  const blogs = await Blog.find()
    .populate("owner listing")
    .sort({ createdAt: -1 });

  res.render("home/homepage.ejs", { listings, blogs });
});

module.exports = router;
