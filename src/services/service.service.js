import { serviceRepository } from '../repositories/service.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { subCategoryRepository } from '../repositories/subCategory.repository.js';
import { r2StorageService } from './r2Storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ServiceService {

  // Slug Generator Helper
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // Unique Slug Generator Helper
  async generateUniqueSlug(text, currentId = null) {
    let baseSlug = this.slugify(text);
    if (!baseSlug) baseSlug = 'service';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const filter = { slug };
      if (currentId) {
        filter._id = { $ne: currentId };
      }
      const existing = await serviceRepository.model.findOne(filter);
      if (!existing) {
        return slug;
      }
      slug = `${baseSlug}-${counter++}`;
    }
  }

  // 1. CREATE SERVICE
  async createService(serviceData, createdById) {
    // Validate Category
    const parentCategory = await categoryRepository.findById(serviceData.category);
    if (!parentCategory || parentCategory.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent Category not found or deleted');
    }

    // Validate SubCategory
    const parentSubCategory = await subCategoryRepository.findById(serviceData.subCategory);
    if (!parentSubCategory || parentSubCategory.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent SubCategory not found or deleted');
    }

    const baseText = serviceData.slug || serviceData.name || 'service';
    const slug = await this.generateUniqueSlug(baseText);

    let imageUrl = serviceData.thumbnail || serviceData.image || '';
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      imageUrl = await r2StorageService.uploadBase64Image(imageUrl, 'services');
    }

    const service = await serviceRepository.create({
      ...serviceData,
      thumbnail: imageUrl,
      image: imageUrl,
      slug,
      status: serviceData.status || 'active',
      createdBy: createdById,
    });

    return await service.populate([
      { path: 'category', select: 'name slug image icon' },
      { path: 'subCategory', select: 'name slug image icon' },
    ]);
  }

  // 2. UPDATE SERVICE
  async updateService(serviceId, updateData, updatedById) {
    const service = await serviceRepository.findById(serviceId);
    if (!service || service.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service record not found');
    }

    if (updateData.category) {
      const cat = await categoryRepository.findById(updateData.category);
      if (!cat || cat.status === 'deleted') throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent Category not found');
    }

    if (updateData.subCategory) {
      const subCat = await subCategoryRepository.findById(updateData.subCategory);
      if (!subCat || subCat.status === 'deleted') throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent SubCategory not found');
    }

    if (updateData.name || updateData.slug) {
      const baseText = updateData.slug || updateData.name;
      updateData.slug = await this.generateUniqueSlug(baseText, serviceId);
    }

    const updated = await serviceRepository.updateById(serviceId, {
      ...updateData,
      updatedBy: updatedById,
    });

    return await updated.populate([
      { path: 'category', select: 'name slug image icon' },
      { path: 'subCategory', select: 'name slug image icon' },
    ]);
  }

  // 3. SOFT DELETE SERVICE
  async deleteService(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service || service.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service record not found');
    }

    service.status = 'deleted';
    await service.save();

    return { message: `Service '${service.name}' soft deleted successfully` };
  }

  // 4. RESTORE SOFT-DELETED SERVICE
  async restoreService(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service record not found');
    }

    service.status = 'active';
    await service.save();

    return { message: `Service '${service.name}' restored to ACTIVE status`, service };
  }

  // 5. UPDATE STATUS (ACTIVE / INACTIVE)
  async updateStatus(serviceId, status) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service record not found');
    }

    service.status = status;
    await service.save();

    return { message: `Service status updated to '${status.toUpperCase()}'`, service };
  }

  // 6. ADMIN SEARCH, PAGINATION, CITY & CATEGORY FILTERS (Super Admin Access)
  async getServicesForAdmin(queryParams) {
    const page = parseInt(queryParams.page || 1, 10);
    const limit = parseInt(queryParams.limit || 10, 10);
    const search = queryParams.search || '';
    const categoryId = queryParams.category || '';
    const subCategoryId = queryParams.subCategory || '';
    const city = queryParams.city || '';
    const status = queryParams.status || '';
    const sortBy = queryParams.sortBy || 'sortOrder';
    const sortOrder = queryParams.order === 'desc' ? -1 : 1;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' };
    }

    if (categoryId) filter.category = categoryId;
    if (subCategoryId) filter.subCategory = subCategoryId;
    if (city) filter.cities = { $in: [city] };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const items = await serviceRepository.model
      .find(filter)
      .populate('category', 'name slug image icon')
      .populate('subCategory', 'name slug image icon')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await serviceRepository.model.countDocuments(filter);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // 7. PUBLIC & CUSTOMERS SEARCH & LIST (ONLY ACTIVE SERVICES)
  async getActiveServicesForPublic(queryParams) {
    const search = queryParams.search || '';
    const city = queryParams.city || '';
    const filter = { status: 'active' };

    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.subCategory) filter.subCategory = queryParams.subCategory;
    if (city) filter.cities = { $in: [city] };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    return await serviceRepository.model
      .find(filter)
      .populate('category', 'name slug image icon')
      .populate('subCategory', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }

  // 8. GET SERVICE BY SLUG
  async getServiceBySlug(slug) {
    const service = await serviceRepository.findBySlug(slug);
    if (!service || service.status !== 'active') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found or inactive');
    }
    return service;
  }
}

export const serviceService = new ServiceService();
