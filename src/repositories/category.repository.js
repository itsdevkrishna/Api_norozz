import { BaseRepository } from './base.repository.js';
import { Category } from '../models/category.model.js';

export class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug) {
    return await this.model.findOne({ slug, status: { $ne: 'deleted' } });
  }

  async findActiveCategories(sort = { sortOrder: 1, name: 1 }) {
    return await this.model.find({ status: 'active' }).sort(sort);
  }
}

export const categoryRepository = new CategoryRepository();
