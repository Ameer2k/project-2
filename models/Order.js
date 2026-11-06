const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        title: String,
        image: String,
        price: Number,
        photographer: String,
      },
    ],
    total: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
