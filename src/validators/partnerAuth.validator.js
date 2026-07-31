import { body } from 'express-validator';

export const partnerSignupRules = [
  body('agencyName').trim().notEmpty().withMessage('Business / Agency Name is required'),
  body('name').trim().notEmpty().withMessage('Partner Contact Name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('phone').trim().notEmpty().withMessage('Mobile phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('category').optional().trim(),
  body('city').optional().trim(),
];

export const partnerLoginRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const partnerForgotPasswordRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
];

export const partnerResetPasswordRules = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('Valid 4-6 digit OTP code is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];
