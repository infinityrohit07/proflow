import { Notification } from '../models/notification.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'fullname username avatar')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, notifications, 'Notifications retrieved successfully')
  );
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { count }, 'Unread count retrieved successfully')
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.read = true;
  await notification.save();

  return res.status(200).json(
    new ApiResponse(200, notification, 'Notification marked as read')
  );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'All notifications marked as read')
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});
