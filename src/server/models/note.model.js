import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Note',
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['general', 'idea', 'meeting', 'technical'],
      default: 'general',
    },
    color: {
      type: String,
      enum: ['slate', 'blue', 'emerald', 'amber', 'violet'],
      default: 'slate',
    },
  },
  { timestamps: true }
);

export const ProjectNote = mongoose.model('ProjectNote', noteSchema);
