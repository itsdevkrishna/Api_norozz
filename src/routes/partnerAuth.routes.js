import { Router } from 'express';
import { partnerAuthController } from '../controllers/partnerAuth.controller.js';
import {
  partnerSignupRules,
  partnerLoginRules,
  partnerForgotPasswordRules,
  partnerResetPasswordRules,
} from '../validators/partnerAuth.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Public Authentication Endpoints
router.post('/signup', partnerSignupRules, validate, partnerAuthController.signup);
router.post('/login', partnerLoginRules, validate, partnerAuthController.login);
router.post('/forgot-password', partnerForgotPasswordRules, validate, partnerAuthController.forgotPassword);
router.post('/reset-password', partnerResetPasswordRules, validate, partnerAuthController.resetPassword);

// Protected Partner Endpoints (Requires JWT Access Token)
router.post('/logout', verifyJWT, partnerAuthController.logout);
router.get('/kyc-status', verifyJWT, partnerAuthController.getKycStatus);

// Multi-file Upload for KYC Documents (Aadhaar, PAN, GST, Bank Passbook, Profile Image)
router.post(
  '/upload-documents',
  verifyJWT,
  upload.fields([
    { name: 'aadhaarDoc', maxCount: 1 },
    { name: 'panDoc', maxCount: 1 },
    { name: 'gstDoc', maxCount: 1 },
    { name: 'bankPassbookDoc', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
  ]),
  partnerAuthController.uploadDocuments
);

export default router;
