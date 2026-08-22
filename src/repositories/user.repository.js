import { BaseRepository } from './base.repository.js';
import { User } from '../models/user.model.js';

/**
 * User Repository extending BaseRepository
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, selectWithPassword = false) {
    const query = this.model.findOne({ email });
    if (selectWithPassword) {
      query.select('+password');
    }
    return await query;
  }

  async findByPhone(phone, selectWithPassword = false) {
    if (!phone) return null;
    const clean = phone.trim();
    const digits = clean.replace(/\D/g, '');
    const isPhone = digits.length >= 7;
    const base10 = digits.length >= 10 ? digits.slice(-10) : digits;

    const searchConditions = [{ phone: clean }];
    if (isPhone) {
      searchConditions.push(
        { phone: base10 },
        { phone: `+91${base10}` },
        { phone: `91${base10}` },
        { phone: `0${base10}` },
        { phone: new RegExp(`${base10}$`) }
      );
    }

    const query = this.model.findOne({ $or: searchConditions });
    if (selectWithPassword) {
      query.select('+password');
    }
    return await query;
  }

  async findByEmailOrPhone(identifier, selectWithPassword = false) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const digits = clean.replace(/\D/g, '');
    const isPhone = digits.length >= 7;
    const base10 = digits.length >= 10 ? digits.slice(-10) : digits;

    const orConditions = [
      { email: clean.toLowerCase() },
      { phone: clean }
    ];

    if (isPhone) {
      orConditions.push(
        { phone: base10 },
        { phone: `+91${base10}` },
        { phone: `91${base10}` },
        { phone: `0${base10}` },
        { phone: new RegExp(`${base10}$`) }
      );
    }

    const query = this.model.findOne({ $or: orConditions });
    if (selectWithPassword) {
      query.select('+password');
    }
    return await query;
  }

  async updateRefreshToken(userId, refreshToken) {
    return await this.model.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async findByRole(role) {
    return await this.model.find({ role }).sort({ createdAt: -1 });
  }

  async findByCity(assignedCity) {
    return await this.model.find({ assignedCity }).sort({ createdAt: -1 });
  }
}

export const userRepository = new UserRepository();
