import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true },
);

// Automatically delete expired sessions
qrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique index per room (only one active QR session per room)
qrSessionSchema.index({ roomId: 1 }, { unique: true });

export default mongoose.model("QRSession", qrSessionSchema);
