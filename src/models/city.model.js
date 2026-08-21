import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
      unique: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    coordinates: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
      zoom: { type: Number, default: 11 },
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
  { timestamps: true }
);

export const City = mongoose.model('City', citySchema);
