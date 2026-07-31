import { BaseController } from './base.controller.js';
import { autoAssignmentService } from '../services/autoAssignment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class AutoAssignmentController extends BaseController {

  autoAssign = asyncHandler(async (req, res) => {
    const result = await autoAssignmentService.autoAssignPartner(req.params.bookingId);
    return this.sendSuccess(res, result, result.message);
  });

  toggleAvailability = asyncHandler(async (req, res) => {
    const result = await autoAssignmentService.togglePartnerAvailability(req.user._id, req.body);
    return this.sendSuccess(res, result, result.message);
  });
}

export const autoAssignmentController = new AutoAssignmentController();
