import { Router } from 'express';
import { getCalendarTasks } from '../controllers/calendar.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/').get(getCalendarTasks);

export default router;
