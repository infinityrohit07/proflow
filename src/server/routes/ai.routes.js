import { Router } from 'express';
import { generateSubtasks, summarizeNotes } from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/generate-subtasks', generateSubtasks);
router.post('/summarize-notes', summarizeNotes);

export default router;
