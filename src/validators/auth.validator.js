import { body } from 'express-validator';

// Customer Validation Rules
export const customerSignupRules = [
  body('name').trim().notEmpty().withMessage('Customer Full Name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
];

export const customerLoginRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const customerForgotPasswordRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
];

export const customerResetPasswordRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('Valid 4-6 digit OTP code is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Partner Validation Rules
export const partnerSignupRules = [
  body('agencyName').trim().notEmpty().withMessage('Business / Agency Name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Mobile Phone number is required'),
  body('category').optional().trim(),
  body('city').optional().trim(),
];

export const partnerLoginRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// City Admin Validation Rules
export const cityAdminLoginRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Super Admin Validation Rules
export const superAdminLoginRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
