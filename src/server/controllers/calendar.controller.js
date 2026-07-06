import { ProjectMember } from '../models/projectMember.model.js';
import { Task } from '../models/task.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCalendarTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's projects
  const memberships = await ProjectMember.find({ user: userId }).populate('project');
  const projectIds = memberships.map(m => m.project._id);

  // Get tasks for these projects that have a due date
  const tasks = await Task.find({ 
    project: { $in: projectIds }
  })
    .populate('project', 'name')
    .populate('assignedTo', 'username fullname avatar')
    .sort({ dueDate: 1 });

  return res.status(200).json(new ApiResponse(200, tasks, 'Calendar tasks fetched'));
});
