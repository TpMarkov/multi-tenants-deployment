import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("MenuItem", menuItemSchema);
