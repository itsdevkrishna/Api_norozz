import { Router } from 'express';
import { serviceController } from '../controllers/service.controller.js';
import {
  createServiceRules,
  updateServiceRules,
  updateServiceStatusRules,
} from '../validators/service.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.constant.js';

const router = Router();

// =====================================
// CUSTOMER & PUBLIC ROUTES (Active Services Only)
// =====================================
router.get('/', serviceController.getPublicServices);
router.get('/slug/:slug', serviceController.getServiceBySlug);

// =====================================
// SUPER ADMIN MANAGEMENT ROUTES (Protected)
// =====================================
router.get('/admin/all', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), serviceController.getAdminServices);
router.post('/', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), createServiceRules, validate, serviceController.createService);
router.put('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateServiceRules, validate, serviceController.updateService);
router.delete('/:id', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), serviceController.deleteService);
router.patch('/:id/restore', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), serviceController.restoreService);
router.patch('/:id/status', verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN), updateServiceStatusRules, validate, serviceController.updateStatus);

export default router;
