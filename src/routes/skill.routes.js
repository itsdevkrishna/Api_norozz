import { Router } from 'express';
import { skillController } from '../controllers/skill.controller.js';
import { createSkillRules, updateSkillRules } from '../validators/skill.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Client Skill Endpoints
router.get('/', skillController.getAllSkills);
router.get('/:id', skillController.getSkillById);

// Protected Admin Skill Endpoints
router.post('/', verifyJWT, createSkillRules, validate, skillController.createSkill);
router.put('/:id', verifyJWT, updateSkillRules, validate, skillController.updateSkill);
router.delete('/:id', verifyJWT, skillController.deleteSkill);

export default router;
