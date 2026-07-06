import { ProjectMember } from '../models/projectMember.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTeamMembers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all projects the user is part of
  const myMemberships = await ProjectMember.find({ user: userId });
  const projectIds = myMemberships.map(m => m.project);

  // Find all other users in these projects
  const teamMembers = await ProjectMember.find({ project: { $in: projectIds } })
    .populate('user', 'username email fullname avatar jobTitle bio')
    .populate('project', 'name');

  // Deduplicate users (some users might be in multiple projects)
  // We'll return an array of users with the projects they share
  const usersMap = new Map();

  for (const member of teamMembers) {
    if (!member.user) continue;
    if (member.user._id.toString() === userId.toString()) continue; // Skip self

    const uId = member.user._id.toString();
    if (!usersMap.has(uId)) {
      usersMap.set(uId, {
        _id: member.user._id,
        username: member.user.username,
        email: member.user.email,
        fullname: member.user.fullname,
        avatar: member.user.avatar,
        jobTitle: member.user.jobTitle || '',
        bio: member.user.bio || '',
        sharedProjects: []
      });
    }
    
    usersMap.get(uId).sharedProjects.push({
      _id: member.project._id,
      name: member.project.name,
      role: member.role
    });
  }

  const team = Array.from(usersMap.values());

  return res.status(200).json(new ApiResponse(200, team, 'Team members fetched successfully'));
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('username email fullname avatar');
  return res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
});
