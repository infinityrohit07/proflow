import { Router } from 'express';
import {
  getProjectNotes,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/note.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/project/:projectId')
  .get(getProjectNotes)
  .post(createNote);

router.route('/:noteId')
  .put(updateNote)
  .delete(deleteNote);

export default router;
