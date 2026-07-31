import { body } from 'express-validator';

export const toggleFavoriteRules = [
  body('serviceName').trim().notEmpty().withMessage('Service Name is required to bookmark'),
];
