import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ROLES } from '../constants/roles.constant.js';

/**
 * Middleware to enforce KYC approval lock on Partner accounts
 */
export const requireApprovedKyc = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  // If user is a Partner, verify kycStatus === 'approved'
  if (req.user.role === ROLES.PARTNER && req.user.kycStatus !== 'approved') {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      `KYC verification required. Your account status is currently '${req.user.kycStatus.toUpperCase()}'. Booking features are locked until City Admin approves your documents.`
    );
  }

  next();
};
