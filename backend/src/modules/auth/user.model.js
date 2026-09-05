import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'commenter', 'viewer', 'user', 'member'],
      default: 'viewer',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      index: { sparse: true },
    },
    resetPasswordToken: {
      type: String,
      index: { sparse: true },
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.resetPasswordToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-validation normalization of legacy roles & fields
userSchema.pre('validate', function () {
  if (this.role) {
    const r = String(this.role).toLowerCase().trim();
    if (['admin', 'owner'].includes(r)) {
      this.role = 'owner';
    } else if (['buyer', 'vendor', 'editor', 'member', 'user'].includes(r)) {
      this.role = 'editor';
    } else if (['commenter'].includes(r)) {
      this.role = 'commenter';
    } else {
      this.role = 'viewer';
    }
  } else {
    this.role = 'viewer';
  }
});

export const User = mongoose.model('User', userSchema);