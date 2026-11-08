const express = require("express");
const app = express();
require("dotenv").config();

if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
  throw new Error("Set MONGODB_URI and SESSION_SECRET in your .env file.");
}

const morgan = require("morgan");
const session = require("express-session");
const methodOverride = require("method-override");
const { MongoStore } = require("connect-mongo");
const connectToDB = require("./db.js");
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");

const authController = require("./routes/auth.routes.js");
const indexController = require("./routes/index.routes.js");
const listingsController = require("./routes/listings.routes.js");
const blogsController = require("./routes/blogs.routes.js");
const cartController = require("./routes/cart.routes.js");
const profileController = require("./routes/profile.routes.js");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);
app.use(passUserToView);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (!origin || req.method === "GET") return next();
  try {
    if (new URL(origin).host === req.get("Host")) return next();
  } catch {}
  res.status(403).send("This request came from another website.");
});

app.use("/auth", authController);
app.use("/", indexController);
app.use("/listings", isSignedIn, listingsController);
app.use("/blogs", isSignedIn, blogsController);
app.use("/cart", isSignedIn, cartController);
app.use("/profiles", isSignedIn, profileController);

app.use((req, res) => res.status(404).send("Page not found."));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 11000) {
    return res.status(400).send("Username or email already taken.");
  }
  if (error.name === "CastError" && error.path === "_id") {
    return res.status(404).send("Page not found.");
  }
  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.name === "MulterError" ||
    error.code === "UNSUPPORTED_UPLOAD_TYPE"
  ) {
    return res.status(400).send("Please check your form and try again.");
  }
  console.error(error);
  res.status(500).send("Something went wrong. Please try again.");
});

async function startServer() {
  const port = process.env.PORT || 3000;
  await connectToDB();
  app.listen(port, () => console.log(`App is running on port ${port}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start the application:", error);
    process.exitCode = 1;
  });
}

module.exports = app;
