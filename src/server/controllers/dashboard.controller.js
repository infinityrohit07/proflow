import { ProjectMember } from '../models/projectMember.model.js';
import { Task } from '../models/task.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's projects
  const memberships = await ProjectMember.find({ user: userId }).populate('project');
  const projectIds = memberships.map(m => m.project._id);

  // Get tasks for these projects
  const tasks = await Task.find({ project: { $in: projectIds } });

  const totalProjects = projectIds.length;
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const teamVelocity = Math.round(completedTasks / Math.max(totalProjects, 1) * 10) / 10; // fake logic for velocity

  const activeProjects = memberships.map(m => {
    const pTasks = tasks.filter(t => t.project.toString() === m.project._id.toString());
    const pCompleted = pTasks.filter(t => t.status === 'done').length;
    const progress = pTasks.length ? Math.round((pCompleted / pTasks.length) * 100) : 0;
    
    return {
      _id: m.project._id,
      name: m.project.name,
      description: m.project.description,
      progress,
    };
  });

  return res.status(200).json(new ApiResponse(200, {
    totalProjects,
    tasksInProgress,
    completedTasks,
    teamVelocity,
    activeProjects
  }, 'Dashboard stats fetched'));
});
