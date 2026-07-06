import { Router } from 'express';
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask
} from '../controllers/task.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = Router();

// Multer config for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword' // doc
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, pdf, and docx are allowed.'), false);
  }
};

const uploadAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.use(verifyJWT);

// Task routes
router.route('/project/:projectId')
  .get(getProjectTasks)
  .post(uploadAttachments.array('attachments', 5), createTask);

router.route('/:taskId')
  .put(uploadAttachments.array('attachments', 5), updateTask)
  .delete(deleteTask);

// Subtask routes
router.route('/:taskId/subtasks')
  .post(createSubtask);

router.route('/subtasks/:subTaskId')
  .put(updateSubtask)
  .delete(deleteSubtask);

export default router;
