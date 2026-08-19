import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    bookingRef: {
      type: String,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'partner', 'system'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
