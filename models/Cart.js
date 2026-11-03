const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    listings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
    }]
}, {timestamps: true});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
