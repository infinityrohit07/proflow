import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
  getProjectMembers,
  addProjectMember,
  updateOrRemoveProjectMember,
  getProjectActivities,
} from '../controllers/project.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:projectId')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:projectId/members')
  .get(getProjectMembers)
  .post(addProjectMember);

router.route('/:projectId/members/:userId')
  .put(updateOrRemoveProjectMember)
  .delete((req, res, next) => {
    req.body.remove = true;
    next();
  }, updateOrRemoveProjectMember);

router.route('/:projectId/activities')
  .get(getProjectActivities);

export default router;
