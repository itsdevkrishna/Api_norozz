import { BaseController } from './base.controller.js';
import { subCategoryService } from '../services/subCategory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class SubCategoryController extends BaseController {

  createSubCategory = asyncHandler(async (req, res) => {
    const subCategory = await subCategoryService.createSubCategory(req.body, req.user._id);
    return this.sendCreated(res, subCategory, 'SubCategory created successfully');
  });

  updateSubCategory = asyncHandler(async (req, res) => {
    const updated = await subCategoryService.updateSubCategory(req.params.id, req.body, req.user._id);
    return this.sendSuccess(res, updated, 'SubCategory updated successfully');
  });

  deleteSubCategory = asyncHandler(async (req, res) => {
    const result = await subCategoryService.deleteSubCategory(req.params.id);
    return this.sendSuccess(res, result, result.message);
  });

  restoreSubCategory = asyncHandler(async (req, res) => {
    const result = await subCategoryService.restoreSubCategory(req.params.id);
    return this.sendSuccess(res, result, result.message);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await subCategoryService.updateStatus(req.params.id, status);
    return this.sendSuccess(res, result, result.message);
  });

  getAdminSubCategories = asyncHandler(async (req, res) => {
    const result = await subCategoryService.getSubCategoriesForAdmin(req.query);
    return this.sendSuccess(res, result, 'Admin sub-category directory retrieved successfully');
  });

  getPublicSubCategories = asyncHandler(async (req, res) => {
    const subCategories = await subCategoryService.getActiveSubCategoriesForPublic(req.query);
    return this.sendSuccess(res, subCategories, 'Active sub-categories retrieved successfully');
  });

  getByCategory = asyncHandler(async (req, res) => {
    const subCategories = await subCategoryService.getByCategory(req.params.categoryId);
    return this.sendSuccess(res, subCategories, 'Sub-categories for parent category retrieved successfully');
  });
}

export const subCategoryController = new SubCategoryController();
