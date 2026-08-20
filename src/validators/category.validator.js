import { body } from 'express-validator';

export const createCategoryRules = [
  body('name').trim().notEmpty().withMessage('Category Name is required'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('sortOrder').optional().isNumeric().withMessage('Sort order must be a number'),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
  body('seoKeywords').optional().isArray().withMessage('SEO Keywords must be an array of strings'),
  body('skills').optional().isArray().withMessage('Skills must be an array of strings'),
];

export const updateCategoryRules = [
  body('name').optional().trim().notEmpty().withMessage('Category Name cannot be empty'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('sortOrder').optional().isNumeric().withMessage('Sort order must be a number'),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
  body('seoKeywords').optional().isArray().withMessage('SEO Keywords must be an array of strings'),
  body('skills').optional().isArray().withMessage('Skills must be an array of strings'),
];

export const updateCategoryStatusRules = [
  body('status').isIn(['active', 'inactive', 'deleted']).withMessage('Status must be active, inactive, or deleted'),
];
