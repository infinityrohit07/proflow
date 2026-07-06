import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    category: { type: String, default: 'general' },
    priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high', 'critical'] },
    startDate: { type: Date },
    dueDate: { type: Date },
    githubLink: { type: String, default: '' },
    figmaLink: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
