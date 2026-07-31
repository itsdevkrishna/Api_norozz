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
