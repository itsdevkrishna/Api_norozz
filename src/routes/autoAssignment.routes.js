import { Router } from 'express';
import { autoAssignmentController } from '../controllers/autoAssignment.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL Dispatch endpoints with JWT
router.use(verifyJWT);

router.post('/auto-assign/:bookingId', autoAssignmentController.autoAssign);
router.patch('/partner-availability', autoAssignmentController.toggleAvailability);

export default router;
