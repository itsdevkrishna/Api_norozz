import { Router } from 'express';
import { subCategoryController } from '../controllers/subCategory.controller.js';
import {
  createSubCategoryRules,
  updateSubCategoryRules,
  updateSubCategoryStatusRules,
} from '../validators/subCategory.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.constant.js';

const router = Router();

// =====================================
// CUSTOMER & PUBLIC ROUTES (Active SubCategories Only)
// =====================================
router.get('/', subCategoryController.getPublicSubCategories);
router.get('/category/:categoryId', subCategoryController.getByCategory);

// =====================================
// SUPER ADMIN MANAGEMENT ROUTES (Protected)
// =====================================
router.get('/admin/all', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), subCategoryController.getAdminSubCategories);
router.post('/', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), createSubCategoryRules, validate, subCategoryController.createSubCategory);
router.put('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateSubCategoryRules, validate, subCategoryController.updateSubCategory);
router.delete('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), subCategoryController.deleteSubCategory);
router.patch('/:id/restore', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), subCategoryController.restoreSubCategory);
router.patch('/:id/status', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateSubCategoryStatusRules, validate, subCategoryController.updateStatus);

export default router;
