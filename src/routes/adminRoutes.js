import express from 'express';
import {
  getDashboardStats,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply JWT authentication & Super Admin authorization to all routes in this router
router.use(protect);
router.use(authorize('superadmin'));

// Stats Route
router.get('/stats', getDashboardStats);

// Admin Specific CRUD Routes
router.route('/admins')
  .get(getAdmins)
  .post(createAdmin);

router.route('/admins/:id')
  .put(updateAdmin)
  .delete(deleteAdmin);

// General User Management Routes
router.route('/users')
  .get(getAllUsers)
  .post(createUserByAdmin);

router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
