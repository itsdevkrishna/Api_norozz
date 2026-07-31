import { body } from 'express-validator';

export const createSubCategoryRules = [
  body('name').trim().notEmpty().withMessage('SubCategory Name is required'),
  body('category').isMongoId().withMessage('Valid Parent Category Mongo ID is required'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('sortOrder').optional().isNumeric().withMessage('Sort order must be a number'),
];

export const updateSubCategoryRules = [
  body('name').optional().trim().notEmpty().withMessage('SubCategory Name cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid Parent Category Mongo ID is required'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('sortOrder').optional().isNumeric().withMessage('Sort order must be a number'),
];

export const updateSubCategoryStatusRules = [
  body('status').isIn(['active', 'inactive', 'deleted']).withMessage('Status must be active, inactive, or deleted'),
];
