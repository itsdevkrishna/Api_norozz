import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Standardized API Response Helper Class
 */
export class ApiResponse {
  constructor(statusCode = HTTP_STATUS.OK, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}
