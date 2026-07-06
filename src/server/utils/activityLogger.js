import { Activity } from '../models/activity.model.js';

export const logActivity = async (userId, projectId, action, description) => {
  try {
    await Activity.create({
      user: userId,
      project: projectId || null,
      action,
      description,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
