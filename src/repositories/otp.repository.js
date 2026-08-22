import { BaseRepository } from './base.repository.js';
import { Otp } from '../models/otp.model.js';

export class OtpRepository extends BaseRepository {
  constructor() {
    super(Otp);
  }

  async findLatestValidOtp(emailOrPhone, type = 'resetPassword') {
    if (!emailOrPhone) return null;
    const clean = emailOrPhone.trim();
    const digits = clean.replace(/\D/g, '');
    const isPhone = digits.length >= 7;
    const base10 = digits.length >= 10 ? digits.slice(-10) : digits;

    const searchTargets = isPhone
      ? [clean, base10, `+91${base10}`, `91${base10}`, `0${base10}`]
      : [clean];

    return await this.model
      .findOne({
        emailOrPhone: { $in: searchTargets },
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
