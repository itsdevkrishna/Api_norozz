import { BaseController } from './base.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class HealthController extends BaseController {
  check = asyncHandler(async (req, res) => {
    const healthInfo = {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'NOROZZ Backend Platform API',
    };
    return this.sendSuccess(res, healthInfo, 'System is healthy and operational');
  });
}

export const healthController = new HealthController();
