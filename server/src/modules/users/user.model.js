import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin', 'property_admin', 'staff'],
      default: 'staff',
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: function () {
        return this.role !== 'super_admin';
      },
    },
    avatar: {
      type: String,
      default: null
    },
    permissions: {
      canViewAll: { type: Boolean, default: false },
      canManageRooms: { type: Boolean, default: false },
      canManageMenu: { type: Boolean, default: false },
      canToggleMenuAvailability: { type: Boolean, default: false },
      noSettings: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    // Set default permissions based on role if new or role changed
    if (this.isNew || this.isModified('role')) {
      switch (this.role) {
        case 'super_admin':
          this.permissions = {
            canViewAll: true,
            canManageRooms: true,
            canManageMenu: true,
            canToggleMenuAvailability: true,
            noSettings: false,
          };
          break;
        case 'property_admin':
          this.permissions = {
            canViewAll: true,
            canManageRooms: false,
            canManageMenu: false,
            canToggleMenuAvailability: true,
            noSettings: false,
          };
          break;
        case 'staff':
          this.permissions = {
            canViewAll: true,
            canManageRooms: false,
            canManageMenu: false,
            canToggleMenuAvailability: true,
            noSettings: true,
          };
          break;
      }
    }
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);