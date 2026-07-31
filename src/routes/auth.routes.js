import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import {
  customerSignupRules,
  customerLoginRules,
  customerForgotPasswordRules,
  customerResetPasswordRules,
  partnerSignupRules,
  partnerLoginRules,
  cityAdminLoginRules,
  superAdminLoginRules,
} from '../validators/auth.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// =====================================
// CUSTOMER AUTHENTICATION ROUTES
// =====================================
router.post('/customer/signup', customerSignupRules, validate, authController.customerSignup);
router.post('/customer/login', customerLoginRules, validate, authController.customerLogin);
router.post('/customer/logout', verifyJWT, authController.customerLogout);
router.post('/customer/refresh-token', authController.customerRefreshToken);
router.post('/customer/forgot-password', customerForgotPasswordRules, validate, authController.customerForgotPassword);
router.post('/customer/reset-password', customerResetPasswordRules, validate, authController.customerResetPassword);

// =====================================
// PARTNER AUTHENTICATION ROUTES
// =====================================
router.post('/partner/signup', partnerSignupRules, validate, authController.partnerSignup);
router.post('/partner/login', partnerLoginRules, validate, authController.partnerLogin);
router.post('/partner/logout', verifyJWT, authController.partnerLogout);

// =====================================
// CITY ADMIN AUTHENTICATION ROUTE
// =====================================
router.post('/admin/login', cityAdminLoginRules, validate, authController.cityAdminLogin);

// =====================================
// SUPER ADMIN AUTHENTICATION ROUTE
// =====================================
router.post('/super-admin/login', superAdminLoginRules, validate, authController.superAdminLogin);

export default router;
