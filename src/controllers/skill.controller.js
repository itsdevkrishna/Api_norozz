import { skillService } from '../services/skill.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class SkillController {
  createSkill = asyncHandler(async (req, res) => {
    const result = await skillService.createSkill(req.body, req.user);
    return res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, result, 'Skill created successfully'));
  });

  getAllSkills = asyncHandler(async (req, res) => {
    const result = await skillService.getAllSkills(req.query);
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, result, 'Skills fetched successfully'));
  });

  getSkillById = asyncHandler(async (req, res) => {
    const result = await skillService.getSkillById(req.params.id);
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, result, 'Skill details fetched successfully'));
  });

  updateSkill = asyncHandler(async (req, res) => {
    const result = await skillService.updateSkill(req.params.id, req.body, req.user);
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, result, 'Skill updated successfully'));
  });

  deleteSkill = asyncHandler(async (req, res) => {
    const result = await skillService.deleteSkill(req.params.id);
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, result, 'Skill deleted successfully'));
  });
}

export const skillController = new SkillController();
