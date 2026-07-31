import { body } from 'express-validator';

export const createCityAdminRules = [
  body('name').trim().notEmpty().withMessage('City Admin Name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('assignedCity').trim().notEmpty().withMessage('Assigned City is required'),
  body('phone').optional().trim(),
];

export const updateCityAdminRules = [
  body('name').optional().trim().notEmpty().withMessage('City Admin Name cannot be empty'),
  body('assignedCity').optional().trim().notEmpty().withMessage('Assigned City cannot be empty'),
  body('phone').optional().trim(),
];

export const resetCityAdminPasswordRules = [
  body('password').isLength({ min: 6 }).withMessage('New Password must be at least 6 characters'),
];

export const updateCityAdminStatusRules = [
  body('status').isIn(['active', 'blocked', 'disabled']).withMessage('Status must be active or blocked/disabled'),
];
