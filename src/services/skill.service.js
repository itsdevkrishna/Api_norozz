import { skillRepository } from '../repositories/skill.repository.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class SkillService {
  async createSkill(skillData, user = null) {
    const { name, category, description } = skillData;

    // Verify Category exists
    const cat = await Category.findById(category);
    if (!cat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Target Category not found');
    }

    const cleanName = name.trim();
    const existing = await skillRepository.model.findOne({
      category,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      status: { $ne: 'deleted' },
    });

    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `Skill '${cleanName}' already exists under '${cat.name}' category`);
    }

    const newSkill = await skillRepository.create({
      name: cleanName,
      category,
      description: description ? description.trim() : '',
      status: 'active',
      createdBy: user?._id || null,
    });

    return await skillRepository.model.findById(newSkill._id).populate('category', 'name slug icon');
  }

  async getAllSkills(queryParams = {}) {
    const { category, categories, search, status } = queryParams;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' };
    }

    if (category) {
      filter.category = category;
    } else if (categories) {
      const catArray = Array.isArray(categories) ? categories : categories.split(',');
      filter.category = { $in: catArray };
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    return await skillRepository.model
      .find(filter)
      .populate('category', 'name slug icon')
      .sort({ name: 1 });
  }

  async getSkillById(id) {
    const skill = await skillRepository.model.findById(id).populate('category', 'name slug icon');
    if (!skill || skill.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Skill not found');
    }
    return skill;
  }

  async updateSkill(id, updateData, user = null) {
    const skill = await skillRepository.findById(id);
    if (!skill || skill.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Skill not found');
    }

    if (updateData.category) {
      const cat = await Category.findById(updateData.category);
      if (!cat) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Target Category not found');
      }
      skill.category = updateData.category;
    }

    if (updateData.name) {
      skill.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      skill.description = updateData.description.trim();
    }
    if (updateData.status) {
      skill.status = updateData.status;
    }
    if (user?._id) {
      skill.updatedBy = user._id;
    }

    await skill.save();
    return await skillRepository.model.findById(skill._id).populate('category', 'name slug icon');
  }

  async deleteSkill(id) {
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Skill not found');
    }
    skill.status = 'deleted';
    await skill.save();
    return { message: 'Skill deleted successfully', id };
  }
}

export const skillService = new SkillService();
