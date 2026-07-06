import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    fullname: { type: String, required: true, trim: true },
    password: { type: String, required: function() { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
    isEmailVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
    forgotPasswordToken: { type: String },
    forgotPasswordExpiry: { type: Date },
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
    bio: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    themePreference: { type: String, enum: ['light', 'dark'], default: 'light' },
    accentColor: { type: String, default: 'indigo' },
    layoutDensity: { type: String, default: 'comfortable' },
    aiPreference: {
      tone: { type: String, enum: ['professional', 'casual', 'concise'], default: 'professional' },
      instructions: { type: String, default: "" },
      autoSummarize: { type: Boolean, default: true },
      suggestionLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    notifications: {
      taskUpdates: { type: Boolean, default: true },
      projectDigest: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true }
    },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" }
    },
    sessions: [
      {
        token: { type: String },
        device: { type: String },
        ip: { type: String },
        location: { type: String },
        lastActive: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username, fullname: this.fullname },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
