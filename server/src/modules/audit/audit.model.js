import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('AuditLog', auditLogSchema);
