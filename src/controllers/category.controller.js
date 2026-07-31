import { BaseController } from './base.controller.js';
import { categoryService } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CategoryController extends BaseController {

  createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body, req.user._id);
    return this.sendCreated(res, category, 'Category created successfully');
  });

  updateCategory = asyncHandler(async (req, res) => {
    const updated = await categoryService.updateCategory(req.params.id, req.body, req.user._id);
    return this.sendSuccess(res, updated, 'Category updated successfully');
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const result = await categoryService.deleteCategory(req.params.id);
    return this.sendSuccess(res, result, result.message);
  });

  restoreCategory = asyncHandler(async (req, res) => {
    const result = await categoryService.restoreCategory(req.params.id);
    return this.sendSuccess(res, result, result.message);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await categoryService.updateStatus(req.params.id, status);
    return this.sendSuccess(res, result, result.message);
  });

  getAdminCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getCategoriesForAdmin(req.query);
    return this.sendSuccess(res, result, 'Admin category directory retrieved successfully');
  });

  getPublicCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getActiveCategoriesForPublic(req.query);
    return this.sendSuccess(res, categories, 'Active categories retrieved successfully');
  });

  getCategoryBySlug = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    return this.sendSuccess(res, category, 'Category details retrieved successfully');
  });
}

export const categoryController = new CategoryController();
