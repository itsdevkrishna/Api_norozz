import { BaseRepository } from './base.repository.js';
import { Skill } from '../models/skill.model.js';

export class SkillRepository extends BaseRepository {
  constructor() {
    super(Skill);
  }

  async findByCategory(categoryId) {
    return await this.model
      .find({ category: categoryId, status: { $ne: 'deleted' } })
      .populate('category', 'name slug icon')
      .sort({ name: 1 });
  }

  async findByCategories(categoryIds) {
    return await this.model
      .find({ category: { $in: categoryIds }, status: { $ne: 'deleted' } })
      .populate('category', 'name slug icon')
      .sort({ name: 1 });
  }

  async findActive(filter = {}) {
    return await this.model
      .find({ ...filter, status: 'active' })
      .populate('category', 'name slug icon')
      .sort({ name: 1 });
  }
}

export const skillRepository = new SkillRepository();
