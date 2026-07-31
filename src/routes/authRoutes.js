import express from 'express';
import { login, register, getMe, seedSuperAdmin } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/seed', seedSuperAdmin);
router.get('/me', protect, getMe);

export default router;
