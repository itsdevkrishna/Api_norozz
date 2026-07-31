import { BaseRepository } from './base.repository.js';
import { Otp } from '../models/otp.model.js';

export class OtpRepository extends BaseRepository {
  constructor() {
    super(Otp);
  }

  async findLatestValidOtp(emailOrPhone, type = 'resetPassword') {
    return await this.model
      .findOne({
        emailOrPhone,
        type,
        isVerified: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });
  }

  async markAsVerified(id) {
    return await this.model.findByIdAndUpdate(id, { isVerified: true }, { new: true });
  }
}

export const otpRepository = new OtpRepository();
