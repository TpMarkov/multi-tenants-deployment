import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  feedbackType: {
    type: String,
    enum: ['food', 'service', 'room', 'overall', 'other'],
    default: 'overall'
  }
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);