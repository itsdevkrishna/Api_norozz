import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BaseController {
  sendSuccess(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  sendCreated(res, data = null, message = 'Resource Created Successfully') {
    return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, data, message));
  }
}
