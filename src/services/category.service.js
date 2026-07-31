import { categoryRepository } from '../repositories/category.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CategoryService {

  // Slug Generator Helper
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // 1. CREATE CATEGORY
  async createCategory(categoryData, createdById) {
    const slug = categoryData.slug ? this.slugify(categoryData.slug) : this.slugify(categoryData.name);
    
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `Category with slug '${slug}' already exists`);
    }

    const category = await categoryRepository.create({
      ...categoryData,
      slug,
      status: categoryData.status || 'active',
      createdBy: createdById,
    });

    return category;
  }

  // 2. UPDATE CATEGORY
  async updateCategory(categoryId, updateData, updatedById) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category record not found');
    }

    if (updateData.name && !updateData.slug) {
      updateData.slug = this.slugify(updateData.name);
    } else if (updateData.slug) {
      updateData.slug = this.slugify(updateData.slug);
    }

    if (updateData.slug && updateData.slug !== category.slug) {
      const existing = await categoryRepository.findBySlug(updateData.slug);
      if (existing) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `Category with slug '${updateData.slug}' already exists`);
      }
    }

    const updated = await categoryRepository.updateById(categoryId, {
      ...updateData,
      updatedBy: updatedById,
    });

    return updated;
  }

  // 3. SOFT DELETE CATEGORY
  async deleteCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category record not found');
    }

    category.status = 'deleted';
    await category.save();

    return { message: `Category '${category.name}' soft deleted successfully` };
  }

  // 4. RESTORE SOFT-DELETED CATEGORY
  async restoreCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category record not found');
    }

    category.status = 'active';
    await category.save();

    return { message: `Category '${category.name}' restored to ACTIVE status`, category };
  }

  // 5. UPDATE STATUS (ACTIVE / INACTIVE)
  async updateStatus(categoryId, status) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category record not found');
    }

    category.status = status;
    await category.save();

    return { message: `Category status updated to '${status.toUpperCase()}'`, category };
  }

  // 6. ADMIN SEARCH, PAGINATION & SORTING (Super Admin Access)
  async getCategoriesForAdmin(queryParams) {
    const page = parseInt(queryParams.page || 1, 10);
    const limit = parseInt(queryParams.limit || 10, 10);
    const search = queryParams.search || '';
    const status = queryParams.status || ''; // 'active', 'inactive', 'deleted'
    const sortBy = queryParams.sortBy || 'sortOrder';
    const sortOrder = queryParams.order === 'desc' ? -1 : 1;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' }; // Hide deleted by default unless requested
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder };
    return await categoryRepository.paginate(filter, page, limit, '', sort);
  }

  // 7. PUBLIC & CUSTOMERS SEARCH, SORTING & LIST (ONLY ACTIVE CATEGORIES)
  async getActiveCategoriesForPublic(queryParams) {
    const search = queryParams.search || '';
    const filter = { status: 'active' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return await categoryRepository.find(filter, '', { sortOrder: 1, name: 1 });
  }

  // 8. GET CATEGORY BY SLUG
  async getCategoryBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category || category.status !== 'active') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category not found or inactive');
    }
    return category;
  }
}

export const categoryService = new CategoryService();
