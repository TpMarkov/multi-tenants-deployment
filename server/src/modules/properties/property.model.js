import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a property name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Property', propertySchema);
