import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Validation Middleware Bridge for Express-Validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  throw new ApiError(
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    'Validation Failed',
    extractedErrors
  );
};
