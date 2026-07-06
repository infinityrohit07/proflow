import { Project } from '../models/project.model.js';
import { ProjectMember } from '../models/projectMember.model.js';
import { createNotification } from '../utils/notification.js';
import { Task } from '../models/task.model.js';
import { Subtask } from '../models/subtask.model.js';
import { ProjectNote } from '../models/note.model.js';
import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// Create a new project
export const createProject = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    category, 
    priority, 
    startDate, 
    dueDate, 
    githubLink, 
    figmaLink, 
    members 
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Project name is required');
  }

  const existingProject = await Project.findOne({ name: name.trim() });
  if (existingProject) {
    throw new ApiError(409, 'Project with this name already exists');
  }

  try {
    const project = await Project.create({ 
      name: name.trim(), 
      description,
      category: category || 'general',
      priority: priority || 'medium',
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      githubLink: githubLink || '',
      figmaLink: figmaLink || '',
      createdBy: req.user._id 
    });

    await ProjectMember.create({ user: req.user._id, project: project._id, role: 'admin' });

    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        if (memberId && memberId.toString() !== req.user._id.toString()) {
          try {
            await ProjectMember.create({ user: memberId, project: project._id, role: 'member' });
            await createNotification({
              recipient: memberId,
              sender: req.user._id,
              type: 'PROJECT_ASSIGNED',
              title: 'Added to Project',
              message: `${req.user.fullname} added you to the project "${project.name}" as a member.`,
              link: `/projects/${project._id}`,
            });
          } catch (mErr) {
            console.error("Failed to add project member during creation:", mErr);
          }
        }
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(201, project, 'Project created successfully'));
  } catch (error) {
    console.error("Create Project Error:", error);
    throw new ApiError(500, 'Failed to create project');
  }
});

// Get all projects for the current user (paginated)
export const getProjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const projectMemberships = await ProjectMember.find({ user: req.user._id })
    .populate('project')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalCount = await ProjectMember.countDocuments({ user: req.user._id });

  const projects = projectMemberships.map((membership) => ({
    ...membership.project.toObject(),
    userRole: membership.role,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      { projects, totalCount, page, limit },
      'Projects fetched successfully'
    )
  );
});

// Get a single project (must be a member)
export const getProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  }).populate('project');

  if (!membership) {
    throw new ApiError(404, 'Project not found or you are not a member');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...membership.project.toObject(), userRole: membership.role },
      'Project fetched successfully'
    )
  );
});

// Update project (admin only)
export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { 
    name, 
    description,
    category,
    priority,
    startDate,
    dueDate,
    githubLink,
    figmaLink
  } = req.body;

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to edit this project');
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      $set: {
        ...(name && { name: name.trim() }),
        description,
        category,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        githubLink,
        figmaLink
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, project, 'Project updated successfully'));
});

// Delete project (admin only)
export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to delete this project');
  }

  try {
    const tasks = await Task.find({ project: projectId });
    const taskIds = tasks.map(t => t._id);

    await Subtask.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: projectId });
    await ProjectNote.deleteMany({ project: projectId });
    
    await Project.findByIdAndDelete(projectId);
    await ProjectMember.deleteMany({ project: projectId });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Project deleted successfully'));
  } catch (error) {
    console.error(error); throw new ApiError(500, "Failed to delete project");
  }
});

// Get members of a project (any member)
export const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isMember = await ProjectMember.exists({
    project: projectId,
    user: req.user._id,
  });

  if (!isMember) {
    throw new ApiError(403, 'You must be a member to view project members');
  }

  const members = await ProjectMember.find({ project: projectId })
    .populate('user', 'username email fullname avatar jobTitle bio')
    .skip(skip)
    .limit(limit);

  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      if (!member.user) return member.toObject();

      const activeTasksCount = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: { $ne: 'done' },
      });

      const completedTasksCount = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: 'done',
      });

      const completedHighPriorityCount = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: 'done',
        priority: { $in: ['high', 'critical'] }
      });

      const overdueTasksCount = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() }
      });

      const score = Math.max(0, (completedTasksCount * 10) + (completedHighPriorityCount * 5) - (overdueTasksCount * 5));

      return {
        ...member.toObject(),
        taskStats: {
          active: activeTasksCount,
          completed: completedTasksCount,
          score,
        },
      };
    })
  );

  const totalCount = await ProjectMember.countDocuments({ project: projectId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { members: membersWithStats, totalCount, page, limit },
        'Project members fetched successfully'
      )
    );
});

// Add member to project (admin only)
export const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, username, role = 'member' } = req.body;

  if (!email && !username) {
    throw new ApiError(400, 'Email or username is required to add a member');
  }

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to add members');
  }

  const userToAdd = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!userToAdd) {
    throw new ApiError(404, 'User not found');
  }

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: userToAdd._id,
  });

  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this project');
  }

  const project = await Project.findById(projectId);
  const newMember = await ProjectMember.create({
    project: projectId,
    user: userToAdd._id,
    role,
  });

  if (project) {
    await createNotification({
      recipient: userToAdd._id,
      sender: req.user._id,
      type: 'PROJECT_ASSIGNED',
      title: 'Added to Project',
      message: `${req.user.fullname} added you to the project "${project.name}" as a ${role}.`,
      link: `/projects/${projectId}`,
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newMember, 'Member added successfully'));
});

// Update or remove member (admin only)
export const updateOrRemoveProjectMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role, remove } = req.body; // if remove is true, delete the member

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to manage members');
  }

  const targetMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (!targetMember) {
    throw new ApiError(404, 'Member not found in this project');
  }

  // Check if target is the last admin
  if (targetMember.role === 'admin' && (remove || role === 'member')) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: 'admin',
    });
    if (adminCount <= 1) {
      throw new ApiError(
        400,
        'Cannot remove or demote the last remaining admin of the project'
      );
    }
  }

  if (remove) {
    await ProjectMember.findByIdAndDelete(targetMember._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Member removed successfully'));
  }

  if (role) {
    targetMember.role = role;
    await targetMember.save();
    return res
      .status(200)
      .json(new ApiResponse(200, targetMember, 'Member role updated successfully'));
  }

  return res.status(200).json(new ApiResponse(200, targetMember, 'No changes made'));
});

export const getProjectActivities = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this project');
  }

  const activities = await Activity.find({ project: projectId })
    .populate('user', 'username fullname avatar')
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json(new ApiResponse(200, activities, 'Project activities fetched successfully'));
});
