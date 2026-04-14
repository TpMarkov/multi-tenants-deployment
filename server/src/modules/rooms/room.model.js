import mongoose from "mongoose";
import crypto from "crypto";

const roomSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    roomNumber: {
      type: String,
      required: [true, "Please add a room number"],
    },
    type: {
      type: String,
      enum: ["Standard", "Deluxe", "Suite", "Presidential"],
      default: "Standard",
    },
    floor: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },
    capacity: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
    },
    qrCodeUrl: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
  },
  { timestamps: true },
);

// Compound index to ensure uniqueness of roomNumber within a property
roomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model("Room", roomSchema);
