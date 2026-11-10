const router = require("express").Router();
const Blog = require("../models/Blog");
const Listing = require("../models/Listing");
const checkRole = require("../middleware/check-role");

router.get("/new", checkRole("user"), async (req, res) => {
  const listings = await Listing.find({ favBy: req.session.user._id });
  res.render("blogs/create-blog.ejs", { listings });
});

router.post("/", checkRole("user"), async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.body.listing,
    favBy: req.session.user._id,
  });
  if (!listing) return res.send("Choose a listing from your favorites first.");

  await Blog.create({
    title: req.body.title,
    content: req.body.content,
    listing: listing._id,
    owner: req.session.user._id,
  });
  res.redirect("/#blogs");
});

router.get("/", (req, res) => {
  res.redirect("/#blogs");
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("owner listing");
  if (!blog) return res.send("Blog not found.");

  res.render("blogs/blog-detail.ejs", { blog });
});

router.get("/:id/edit", async (req, res) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!blog) return res.send("Your blog was not found.");

  res.render("blogs/edit-blog.ejs", { blog });
});

router.put("/:id", async (req, res) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!blog) return res.send("Your blog was not found.");

  blog.title = req.body.title;
  blog.content = req.body.content;
  await blog.save();
  res.redirect("/blogs/" + blog._id);
});

router.delete("/:id", async (req, res) => {
  const blog = await Blog.findOneAndDelete({
    _id: req.params.id,
    owner: req.session.user._id,
  });
  if (!blog) return res.send("Your blog was not found.");

  res.redirect("/auth/profile");
});

router.post("/:id/favorite", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.send("Blog not found.");

  const userId = req.session.user._id;
  const isFavorited = blog.favBy.some((id) => id.equals(userId));
  await Blog.updateOne(
    { _id: blog._id },
    isFavorited
      ? { $pull: { favBy: userId } }
      : { $addToSet: { favBy: userId } },
  );
  res.redirect("/#blogs");
});

module.exports = router;
