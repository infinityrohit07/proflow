import { ProjectNote } from '../models/note.model.js';
import { ProjectMember } from '../models/projectMember.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notification.js';

const checkMembership = async (projectId, userId) => {
  const membership = await ProjectMember.findOne({ project: projectId, user: userId });
  if (!membership) {
    throw new ApiError(403, 'You must be a member of this project');
  }
  return membership;
};

export const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await checkMembership(projectId, req.user._id);

  const notes = await ProjectNote.find({ project: projectId })
    .populate('createdBy', 'username fullname avatar')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, notes, 'Notes fetched successfully'));
});

export const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content, title, isPinned, category, color } = req.body;

  await checkMembership(projectId, req.user._id);

  if (!content) throw new ApiError(400, 'Content is required');

  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content,
    title: title || 'Untitled Note',
    isPinned: isPinned || false,
    category: category || 'general',
    color: color || 'slate',
  });

  await logActivity(req.user._id, projectId, 'create_note', `Created note "${note.title || 'Untitled Note'}"`);

  // Send notifications to all other project members
  const members = await ProjectMember.find({ project: projectId });
  for (const m of members) {
    if (m.user.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: m.user,
        sender: req.user._id,
        type: 'NOTE_ADDED',
        title: 'New Project Note Added',
        message: `${req.user.fullname} added a new note "${note.title || 'Untitled Note'}" to the project.`,
        link: `/projects/${projectId}`,
      });
    }
  }

  const populatedNote = await ProjectNote.findById(note._id).populate('createdBy', 'username fullname avatar');

  return res.status(201).json(new ApiResponse(201, populatedNote, 'Note created successfully'));
});

export const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content, title, isPinned, category, color } = req.body;

  const note = await ProjectNote.findById(noteId);
  if (!note) throw new ApiError(404, 'Note not found');

  const membership = await checkMembership(note.project, req.user._id);

  if (note.createdBy.toString() !== req.user._id.toString() && membership.role !== 'admin') {
    throw new ApiError(403, 'Only the author or project admin can edit this note');
  }

  if (content !== undefined) note.content = content;
  if (title !== undefined) note.title = title;
  if (isPinned !== undefined) note.isPinned = isPinned;
  if (category !== undefined) note.category = category;
  if (color !== undefined) note.color = color;

  await note.save();

  await logActivity(req.user._id, note.project, 'update_note', `Updated note "${note.title || 'Untitled Note'}"`);

  const populatedNote = await ProjectNote.findById(note._id).populate('createdBy', 'username fullname avatar');

  return res.status(200).json(new ApiResponse(200, populatedNote, 'Note updated successfully'));
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId);
  if (!note) throw new ApiError(404, 'Note not found');

  const membership = await checkMembership(note.project, req.user._id);

  if (note.createdBy.toString() !== req.user._id.toString() && membership.role !== 'admin') {
    throw new ApiError(403, 'Only the author or project admin can delete this note');
  }

  await logActivity(req.user._id, note.project, 'delete_note', `Deleted note "${note.title || 'Untitled Note'}"`);

  await ProjectNote.findByIdAndDelete(noteId);

  return res.status(200).json(new ApiResponse(200, {}, 'Note deleted successfully'));
});
