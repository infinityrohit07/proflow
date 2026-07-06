import { Task } from '../models/task.model.js';
import { Subtask } from '../models/subtask.model.js';
import { ProjectMember } from '../models/projectMember.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notification.js';

// Check membership helper
const checkMembership = async (projectId, userId) => {
  const membership = await ProjectMember.findOne({ project: projectId, user: userId });
  if (!membership) {
    throw new ApiError(403, 'You must be a member of this project');
  }
  return membership;
};

export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await checkMembership(projectId, req.user._id);

  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'username fullname avatar')
    .populate('assignedBy', 'username fullname avatar')
    .sort({ createdAt: -1 });

  // Get subtasks for all tasks
  const taskIds = tasks.map(t => t._id);
  const subtasks = await Subtask.find({ task: { $in: taskIds } }).populate('createdBy', 'username fullname avatar');

  const tasksWithSubtasks = tasks.map(task => {
    const taskObj = task.toObject();
    taskObj.subtasks = subtasks.filter(st => st.task.toString() === task._id.toString());
    return taskObj;
  });

  return res.status(200).json(new ApiResponse(200, tasksWithSubtasks, 'Tasks fetched successfully'));
});

export const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, status, dueDate, priority, tags } = req.body;
  
  await checkMembership(projectId, req.user._id);

  if (!title) {
    throw new ApiError(400, 'Title is required');
  }

  let tagsArray = [];
  if (tags) {
    try {
      tagsArray = JSON.parse(tags);
    } catch (e) {
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }
  }

  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadRes = await uploadOnCloudinary(file.path);
      if (uploadRes) {
        attachments.push({
          url: uploadRes.secure_url,
          publicId: uploadRes.public_id,
          mimetype: file.mimetype,
          size: file.size,
          originalName: file.originalname,
        });
      }
    }
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: assignedTo || null,
    assignedBy: req.user._id,
    status: status || 'todo',
    dueDate: dueDate || null,
    priority: priority || 'medium',
    tags: tagsArray,
    attachments,
  });

  await logActivity(req.user._id, projectId, 'create_task', `Created task "${task.title}"`);

  if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${req.user.fullname} assigned you the task "${task.title}".`,
      link: `/projects/${projectId}`,
    });
  }

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'username fullname avatar')
    .populate('assignedBy', 'username fullname avatar');

  const taskObj = populatedTask.toObject();
  taskObj.subtasks = [];

  return res.status(201).json(new ApiResponse(201, taskObj, 'Task created successfully'));
});

export const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status, dueDate, removeAttachments, priority, tags } = req.body;
  
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  
  await checkMembership(task.project, req.user._id);

  // Parse removeAttachments if it's a string (from formData)
  let toRemove = [];
  if (removeAttachments) {
    try {
      toRemove = JSON.parse(removeAttachments);
    } catch (e) {
      if (Array.isArray(removeAttachments)) toRemove = removeAttachments;
      else toRemove = [removeAttachments];
    }
  }

  // Remove specified attachments from cloudinary
  const remainingAttachments = [];
  for (const att of task.attachments) {
    if (toRemove.includes(att.publicId)) {
      await deleteFromCloudinary(att.publicId);
    } else {
      remainingAttachments.push(att);
    }
  }

  // Upload new attachments
  const newAttachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadRes = await uploadOnCloudinary(file.path);
      if (uploadRes) {
        newAttachments.push({
          url: uploadRes.secure_url,
          publicId: uploadRes.public_id,
          mimetype: file.mimetype,
          size: file.size,
          originalName: file.originalname,
        });
      }
    }
  }

  task.title = title || task.title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
  if (status) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (priority !== undefined) task.priority = priority;

  if (tags !== undefined) {
    let tagsArray = [];
    try {
      tagsArray = JSON.parse(tags);
    } catch (e) {
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }
    task.tags = tagsArray;
  }
  
  const statusChanged = status && status !== task.status;
  const prevAssignee = task.assignedTo;
  const assigneeChanged = assignedTo !== undefined && String(assignedTo || '') !== String(prevAssignee || '');
  const oldStatus = task.status;

  task.attachments = [...remainingAttachments, ...newAttachments];

  await task.save();

  if (assigneeChanged && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${req.user.fullname} assigned you the task "${task.title}".`,
      link: `/projects/${task.project}`,
    });
  }

  if (statusChanged && task.assignedTo && req.user._id.toString() !== task.assignedTo.toString()) {
    await createNotification({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: 'TASK_UPDATED',
      title: 'Task Status Updated',
      message: `The task "${task.title}" was moved from "${oldStatus.replace('_', ' ')}" to "${task.status.replace('_', ' ')}" by ${req.user.fullname}.`,
      link: `/projects/${task.project}`,
    });
  }

  const statusLabel = status ? ` to status "${status.replace('_', ' ')}"` : '';
  await logActivity(req.user._id, task.project, 'update_task', `Updated task "${task.title}"${statusLabel}`);

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'username fullname avatar')
    .populate('assignedBy', 'username fullname avatar');

  return res.status(200).json(new ApiResponse(200, populatedTask, 'Task updated successfully'));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  
  const membership = await checkMembership(task.project, req.user._id);
  
  // Safe edit/delete: only the person who created the task OR a project admin can delete it.
  // This choice protects tasks from being deleted by normal members who didn't create them,
  // preventing accidental or malicious data loss, while allowing admins full control.
  if (task.assignedBy.toString() !== req.user._id.toString() && membership.role !== 'admin') {
    throw new ApiError(403, 'Only task creator or project admin can delete this task');
  }

  // Delete attachments
  if (task.attachments && task.attachments.length > 0) {
    for (const att of task.attachments) {
      if (att.publicId) await deleteFromCloudinary(att.publicId);
    }
  }

  await logActivity(req.user._id, task.project, 'delete_task', `Deleted task "${task.title}"`);
  await Subtask.deleteMany({ task: taskId });
  await Task.findByIdAndDelete(taskId);

  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted successfully'));
});

// Subtasks
export const createSubtask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  
  await checkMembership(task.project, req.user._id);

  if (!title) throw new ApiError(400, 'Title is required');

  const subtask = await Subtask.create({
    title,
    task: taskId,
    createdBy: req.user._id,
  });

  const populatedSubtask = await Subtask.findById(subtask._id).populate('createdBy', 'username fullname avatar');

  return res.status(201).json(new ApiResponse(201, populatedSubtask, 'Subtask created'));
});

export const updateSubtask = asyncHandler(async (req, res) => {
  const { subTaskId } = req.params;
  const { title, isCompleted } = req.body;

  const subtask = await Subtask.findById(subTaskId).populate('task');
  if (!subtask) throw new ApiError(404, 'Subtask not found');

  await checkMembership(subtask.task.project, req.user._id);

  if (title) subtask.title = title;
  if (isCompleted !== undefined) subtask.isCompleted = isCompleted;

  await subtask.save();

  const populatedSubtask = await Subtask.findById(subtask._id).populate('createdBy', 'username fullname avatar');

  return res.status(200).json(new ApiResponse(200, populatedSubtask, 'Subtask updated'));
});

export const deleteSubtask = asyncHandler(async (req, res) => {
  const { subTaskId } = req.params;
  const subtask = await Subtask.findById(subTaskId).populate('task');
  if (!subtask) throw new ApiError(404, 'Subtask not found');

  await checkMembership(subtask.task.project, req.user._id);

  await Subtask.findByIdAndDelete(subTaskId);

  return res.status(200).json(new ApiResponse(200, {}, 'Subtask deleted'));
});
