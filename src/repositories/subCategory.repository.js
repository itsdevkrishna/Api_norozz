import { BaseRepository } from './base.repository.js';
import { SubCategory } from '../models/subCategory.model.js';

export class SubCategoryRepository extends BaseRepository {
  constructor() {
    super(SubCategory);
  }

  async findBySlug(slug) {
    return await this.model
      .findOne({ slug, status: { $ne: 'deleted' } })
      .populate('category', 'name slug image icon');
  }

  async findByCategory(categoryId) {
    return await this.model
      .find({ category: categoryId, status: 'active' })
      .populate('category', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }

  async findActiveSubCategories() {
    return await this.model
      .find({ status: 'active' })
      .populate('category', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }
}

export const subCategoryRepository = new SubCategoryRepository();
