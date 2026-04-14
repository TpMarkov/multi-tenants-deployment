import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MenuCategory', menuCategorySchema);
