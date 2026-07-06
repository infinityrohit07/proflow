import mongoose, { Schema } from 'mongoose';

const projectMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
);

// Ensure a user can only be a member of a project once
projectMemberSchema.index({ user: 1, project: 1 }, { unique: true });

export const ProjectMember = mongoose.models.ProjectMember || mongoose.model('ProjectMember', projectMemberSchema);
