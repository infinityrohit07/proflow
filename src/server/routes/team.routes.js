import { Router } from 'express';
import { getTeamMembers, getAllUsers } from '../controllers/team.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/').get(getTeamMembers);
router.route('/all').get(getAllUsers);

export default router;
