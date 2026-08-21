import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLES, ALL_ROLES } from '../constants/roles.constant.js';

const addressSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Home' }, // 'Home', 'Office', 'Parents'
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.CUSTOMER,
    },
    profileImage: {
      type: String,
      default: '',
    },
    dob: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    assignedCity: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'India',
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isLocationSaved: {
      type: Boolean,
      default: false,
    },
    isDocumentsUploaded: {
      type: Boolean,
      default: false,
    },
    isCategorySelected: {
      type: Boolean,
      default: false,
    },
    isSkillsUpdated: {
      type: Boolean,
      default: false,
    },
    isServiceAreaSet: {
      type: Boolean,
      default: false,
    },
    isWorkingHoursSet: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    agencyName: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isKycSubmitted: {
      type: Boolean,
      default: false,
    },
    experience: {
      type: String,
      default: '3-5 Years',
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    certifications: {
      type: [String],
      default: [],
    },
    workRadius: {
      type: Number,
      default: 8,
    },
    localities: {
      type: [String],
      default: [],
    },
    workingHours: [
      {
        day: { type: String, required: true },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '09:00 AM' },
        closeTime: { type: String, default: '07:00 PM' },
      },
    ],
    documents: {
      aadhaarDoc: { type: String, default: '' },
      aadhaarFront: { type: String, default: '' },
      aadhaarBack: { type: String, default: '' },
      panDoc: { type: String, default: '' },
      drivingLicenseDoc: { type: String, default: '' },
      passportPhoto: { type: String, default: '' },
      bankPassbookDoc: { type: String, default: '' },
      gstDoc: { type: String, default: '' },
    },
    addresses: [addressSchema],
    favoriteServices: [{ type: String, trim: true }],
    refreshToken: {
      type: String,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-Validate Middleware to automatically filter out non-ObjectId skill strings
 */
userSchema.pre('validate', function (next) {
  if (Array.isArray(this.skills)) {
    this.skills = this.skills.filter(
      (s) =>
        (typeof s === 'string' && Boolean(s.match(/^[0-9a-fA-F]{24}$/))) ||
        (s && (s._id || s instanceof mongoose.Types.ObjectId))
    );
  }
  next();
});

/**
 * Pre-Save Middleware to automatically hash password using bcryptjs
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance Method: Compare candidate password with hashed password
 */
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance Method: Generate JWT Access Token
 */
userSchema.methods.generateAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign(
    {
      id: this._id,
      userId: this.userId || '',
      email: this.email || '',
      role: this.role,
      name: this.name || '',
      kycStatus: this.kycStatus,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d',
    }
  );
};

/**
 * Instance Method: Generate JWT Refresh Token
 */
userSchema.methods.generateRefreshToken = function () {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    }
  );
};

export const User = mongoose.model('User', userSchema);
