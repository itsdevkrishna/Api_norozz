import { body } from 'express-validator';

export const rejectPartnerRules = [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
];

export const assignBookingRules = [
  body('partnerId').trim().notEmpty().withMessage('Partner ID is required'),
];

export const cancelBookingRules = [
  body('reason').optional().trim(),
];
