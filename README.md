# Frame

## Overview

Frame is a photography marketplace where customers can browse photographer packages, save favorites, add packages to a cart, and share stories about their shoots. Photographers can publish and manage their packages.

## Design Goal

The SVG is the target design for Frame. The overview image shows all of the designed screens together.

![Full Frame target design](./design/target-design-board.png)

[Open the full-size design SVG](./design/Frame.svg).

## Current App Screenshots

These screenshots show all current EJS pages. Pages that normally require sign-in use representative sample data.

### Public Pages

#### Welcome

![Welcome page](./screenshots/current/welcome.png)

#### Sign Up

![Sign-up page](./screenshots/current/sign-up.png)

#### Sign In

![Sign-in page](./screenshots/current/sign-in.png)

### Marketplace

#### Discover

![Discover page](./screenshots/current/discover.png)

#### Listing Details

![Listing details page](./screenshots/current/listing-details.png)

#### Create Listing

![Create listing page](./screenshots/current/create-listing.png)

#### Edit Listing

![Edit listing page](./screenshots/current/edit-listing.png)

### Account and Community

#### Profile

![Profile page](./screenshots/current/profile.png)

#### Edit Profile

![Edit profile page](./screenshots/current/edit-profile.png)

#### Cart

![Cart page](./screenshots/current/cart.png)

#### Blog Details

![Blog details page](./screenshots/current/blog-details.png)

#### Create Blog

![Create blog page](./screenshots/current/create-blog.png)

#### Edit Blog

![Edit blog page](./screenshots/current/edit-blog.png)

## Technologies Used

- Node.js
- Express
- MongoDB and Mongoose
- EJS
- Express Session with MongoDB session storage
- Multer for image uploads
- bcrypt for password hashing
- HTML and CSS

## Getting Started

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   PORT=3000
   ```

3. Start the app:

   ```bash
   npm start
   ```

   For development, run `npm run dev`.

4. Open `http://localhost:3000`.

## User Stories

- As a visitor, I want to sign up or sign in so I can use the marketplace.
- As a customer, I want to browse photographer packages and save favorites.
- As a customer, I want to add packages to my cart and check out.
- As a customer, I want to write and favorite stories about photography experiences.
- As a photographer, I want to publish packages with photos, descriptions, and prices.
- As a photographer, I want to edit or delete my packages.
- As a user, I want to manage my profile and view other users' profiles.

## Database Design

- **User**: username, email, hashed password, profile details, and account role (`user` or `photographer`).
- **Listing**: package title, photos, description, price, photographer owner, and favoriting users.
- **Blog**: title, content, author, optional related listing, and favoriting users.
- **Cart**: customer owner and references to listings.
- **Order**: customer owner, copied package details, and order total.
- **Session**: login session data stored in MongoDB.

Listings and blogs reference users. Blogs may also reference a listing. Carts reference users and listings, while orders store package details as an order snapshot.

![Project database design](./image.png)

## Routes

| Method | Route                     | Description                                   |
| ------ | ------------------------- | --------------------------------------------- |
| GET    | `/`                       | Welcome page or marketplace feed              |
| GET    | `/auth/sign-up`           | Sign-up form                                  |
| POST   | `/auth/sign-up`           | Create an account                             |
| GET    | `/auth/sign-in`           | Sign-in form                                  |
| POST   | `/auth/sign-in`           | Sign in                                       |
| POST   | `/auth/sign-out`          | Sign out                                      |
| GET    | `/auth/profile`           | Redirect to the signed-in user's profile      |
| GET    | `/auth/edit-profile`      | Redirect to profile editing                   |
| GET    | `/listings/new`           | New listing form (photographers)              |
| POST   | `/listings`               | Create a listing (photographers)              |
| GET    | `/listings/:id`           | View a listing                                |
| GET    | `/listings/:id/edit`      | Edit listing form (owner)                     |
| PUT    | `/listings/:id`           | Update listing (owner)                        |
| DELETE | `/listings/:id`           | Delete listing (owner)                        |
| POST   | `/listings/:id/favorite`  | Favorite or unfavorite a listing              |
| GET    | `/blogs/new`              | New blog form                                 |
| POST   | `/blogs`                  | Create a blog                                 |
| GET    | `/blogs`                  | Redirect to the blog section of the home feed |
| GET    | `/blogs/:id`              | View a blog                                   |
| GET    | `/blogs/:id/edit`         | Edit blog form (owner)                        |
| PUT    | `/blogs/:id`              | Update blog (owner)                           |
| DELETE | `/blogs/:id`              | Delete blog (owner)                           |
| POST   | `/blogs/:id/favorite`     | Favorite or unfavorite a blog                 |
| GET    | `/cart`                   | View the signed-in customer's cart            |
| POST   | `/cart/add/:listingId`    | Add a listing to the cart                     |
| DELETE | `/cart/remove/:listingId` | Remove a listing from the cart                |
| POST   | `/cart/checkout`          | Create an order from the cart                 |
| GET    | `/profiles/me/edit`       | Edit profile form                             |
| PUT    | `/profiles/me`            | Update the signed-in user's profile           |
| DELETE | `/profiles/me`            | Delete the signed-in user's account           |
| GET    | `/profiles/:id`           | View a profile                                |

Listing, blog, cart, and profile routes require a signed-in user. Some listing and blog actions are also limited by role or ownership.

## Features

- Separate customer and photographer account roles.
- Password hashing and session-based authentication.
- Photographer listing creation with multiple image uploads.
- Listing editing, deletion, and favorites.
- Customer carts and order records.
- Blogs connected to users and optionally to listings.
- Profile editing, profile pictures, and account deletion.
- User profiles with listings, blogs, and favorites.

## Planned Features from the Target Design

The design board shows the intended future experience. Features not yet implemented include:

- Allow photographer listings to include photos and videos (JPG, PNG, WEBP, MP4, and WEBM), with up to 10 media files and a 25 MB limit per file.
- Add Discover recommendations for photographer profiles and community stories.
- Add follower/following counts and cart history to user profiles.
- Recommend more work from a photographer on listing and blog detail pages.
- Connect checkout to a payment provider; the design currently labels checkout as a demo with no payment collected.
- Update the current pages to match the target design.

## Credits

- [SEB-16-Bahrain MEN Stack Referencing Related Data Open House](https://github.com/SEB-16-Bahrain/men-stack-referencing-related-data-openhouse)
- [SEB-16-Bahrain MEN Stack CRUD App Fruits](https://github.com/SEB-16-Bahrain/men-stack-crud-app-fruits)
- [Google](https://www.google.com/)
