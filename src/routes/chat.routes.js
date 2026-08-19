import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/:bookingId', chatController.getBookingMessages);

export default router;
