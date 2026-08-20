import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import {
  createCategoryRules,
  updateCategoryRules,
  updateCategoryStatusRules,
} from '../validators/category.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.constant.js';

const router = Router();

// =====================================
// CUSTOMER & PUBLIC ROUTES (Active Categories Only)
// =====================================
router.get('/', categoryController.getPublicCategories);
router.get('/skills', categoryController.getSkillsForCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// =====================================
// SUPER ADMIN MANAGEMENT ROUTES (Protected)
// =====================================
router.get('/admin/all', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), categoryController.getAdminCategories);
router.post('/', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), createCategoryRules, validate, categoryController.createCategory);
router.put('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateCategoryRules, validate, categoryController.updateCategory);
router.delete('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), categoryController.deleteCategory);
router.patch('/:id/restore', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), categoryController.restoreCategory);
router.patch('/:id/status', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateCategoryStatusRules, validate, categoryController.updateStatus);

export default router;
