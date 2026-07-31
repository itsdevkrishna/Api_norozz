import { BaseRepository } from './base.repository.js';
import { Service } from '../models/service.model.js';

export class ServiceRepository extends BaseRepository {
  constructor() {
    super(Service);
  }

  async findBySlug(slug) {
    return await this.model
      .findOne({ slug, status: { $ne: 'deleted' } })
      .populate('category', 'name slug image icon')
      .populate('subCategory', 'name slug image icon');
  }

  async findBySubCategory(subCategoryId) {
    return await this.model
      .find({ subCategory: subCategoryId, status: 'active' })
      .populate('category', 'name slug image icon')
      .populate('subCategory', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }

  async findActiveServices(filter = {}) {
    return await this.model
      .find({ ...filter, status: 'active' })
      .populate('category', 'name slug image icon')
      .populate('subCategory', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }
}

export const serviceRepository = new ServiceRepository();
