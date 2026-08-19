import { BaseController } from './base.controller.js';
import { ChatMessage } from '../models/chat.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ChatController extends BaseController {
  getBookingMessages = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { booking: bookingId },
        { bookingRef: bookingId },
        { booking: String(bookingId) }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    return this.sendSuccess(res, messages, 'Chat history retrieved successfully');
  });
}

export const chatController = new ChatController();
