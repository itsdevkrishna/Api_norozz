import { Router } from 'express';
import { cityController } from '../controllers/city.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.constant.js';

const router = Router();

// Public / Active cities endpoint (for dropdowns across apps)
router.get('/active', cityController.getActiveCities);

// Protected Super Admin City Management Endpoints
router.use(verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/', cityController.getAllCities);
router.post('/', cityController.createCity);
router.put('/:id', cityController.updateCity);
router.patch('/:id/status', cityController.toggleCityStatus);
router.delete('/:id', cityController.deleteCity);

export default router;
