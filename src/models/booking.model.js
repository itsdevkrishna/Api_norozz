import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    packageName: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      title: { type: String, default: 'Home' },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    city: {
      type: String,
      required: true,
      default: 'Delhi NCR',
      index: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    timeSlot: {
      type: String,
      required: true,
      default: '04:30 PM - 05:30 PM',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'Accepted',
        'On The Way',
        'Started',
        'Completed',
        'Cancelled',
        'Refunded',
      ],
      default: 'Pending',
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    reviewComment: {
      type: String,
      default: '',
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    completionOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    extraServices: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model('Booking', bookingSchema);
