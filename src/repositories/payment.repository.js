import { BaseRepository } from './base.repository.js';
import { Payment } from '../models/payment.model.js';

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByTransactionId(transactionId) {
    return await this.model
      .findOne({ transactionId })
      .populate('user', 'name email phone')
      .populate('booking');
  }

  async findByUser(userId, type = null) {
    const filter = { user: userId };
    if (type) filter.type = type;
    return await this.model
      .find(filter)
      .populate('booking')
      .sort({ createdAt: -1 });
  }
}

export const paymentRepository = new PaymentRepository();
