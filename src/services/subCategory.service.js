import { subCategoryRepository } from '../repositories/subCategory.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class SubCategoryService {

  // Slug Generator Helper
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // 1. CREATE SUBCATEGORY
  async createSubCategory(subCategoryData, createdById) {
    // Check parent Category existence
    const parentCategory = await categoryRepository.findById(subCategoryData.category);
    if (!parentCategory || parentCategory.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent Category not found or deleted');
    }

    const slug = subCategoryData.slug ? this.slugify(subCategoryData.slug) : this.slugify(subCategoryData.name);
    const existing = await subCategoryRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `SubCategory with slug '${slug}' already exists`);
    }

    const subCategory = await subCategoryRepository.create({
      ...subCategoryData,
      slug,
      status: subCategoryData.status || 'active',
      createdBy: createdById,
    });

    return await subCategory.populate('category', 'name slug image icon');
  }

  // 2. UPDATE SUBCATEGORY
  async updateSubCategory(subCategoryId, updateData, updatedById) {
    const subCategory = await subCategoryRepository.findById(subCategoryId);
    if (!subCategory || subCategory.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'SubCategory record not found');
    }

    if (updateData.category) {
      const parentCategory = await categoryRepository.findById(updateData.category);
      if (!parentCategory || parentCategory.status === 'deleted') {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parent Category not found');
      }
    }

    if (updateData.name && !updateData.slug) {
      updateData.slug = this.slugify(updateData.name);
    } else if (updateData.slug) {
      updateData.slug = this.slugify(updateData.slug);
    }

    if (updateData.slug && updateData.slug !== subCategory.slug) {
      const existing = await subCategoryRepository.findBySlug(updateData.slug);
      if (existing) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `SubCategory with slug '${updateData.slug}' already exists`);
      }
    }

    const updated = await subCategoryRepository.updateById(subCategoryId, {
      ...updateData,
      updatedBy: updatedById,
    });

    return await updated.populate('category', 'name slug image icon');
  }

  // 3. SOFT DELETE SUBCATEGORY
  async deleteSubCategory(subCategoryId) {
    const subCategory = await subCategoryRepository.findById(subCategoryId);
    if (!subCategory || subCategory.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'SubCategory record not found');
    }

    subCategory.status = 'deleted';
    await subCategory.save();

    return { message: `SubCategory '${subCategory.name}' soft deleted successfully` };
  }

  // 4. RESTORE SOFT-DELETED SUBCATEGORY
  async restoreSubCategory(subCategoryId) {
    const subCategory = await subCategoryRepository.findById(subCategoryId);
    if (!subCategory) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'SubCategory record not found');
    }

    subCategory.status = 'active';
    await subCategory.save();

    return { message: `SubCategory '${subCategory.name}' restored to ACTIVE status`, subCategory };
  }

  // 5. UPDATE STATUS (ACTIVE / INACTIVE)
  async updateStatus(subCategoryId, status) {
    const subCategory = await subCategoryRepository.findById(subCategoryId);
    if (!subCategory) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'SubCategory record not found');
    }

    subCategory.status = status;
    await subCategory.save();

    return { message: `SubCategory status updated to '${status.toUpperCase()}'`, subCategory };
  }

  // 6. ADMIN SEARCH, PAGINATION, CATEGORY FILTER & SORTING (Super Admin Access)
  async getSubCategoriesForAdmin(queryParams) {
    const page = parseInt(queryParams.page || 1, 10);
    const limit = parseInt(queryParams.limit || 10, 10);
    const search = queryParams.search || '';
    const categoryId = queryParams.category || '';
    const status = queryParams.status || '';
    const sortBy = queryParams.sortBy || 'sortOrder';
    const sortOrder = queryParams.order === 'desc' ? -1 : 1;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' };
    }

    if (categoryId) {
      filter.category = categoryId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const items = await subCategoryRepository.model
      .find(filter)
      .populate('category', 'name slug image icon')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await subCategoryRepository.model.countDocuments(filter);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // 7. PUBLIC & CUSTOMERS SEARCH & LIST (ONLY ACTIVE SUBCATEGORIES)
  async getActiveSubCategoriesForPublic(queryParams) {
    const search = queryParams.search || '';
    const filter = { status: 'active' };

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return await subCategoryRepository.model
      .find(filter)
      .populate('category', 'name slug image icon')
      .sort({ sortOrder: 1, name: 1 });
  }

  // 8. GET BY PARENT CATEGORY ID
  async getByCategory(categoryId) {
    return await subCategoryRepository.findByCategory(categoryId);
  }
}

export const subCategoryService = new SubCategoryService();
