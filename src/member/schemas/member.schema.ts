import { Schema } from 'mongoose';

export const MemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Team Lead', 'Project Manager', 'Member', 'Viewer', 'Watcher'],
      default: 'Member',
      required: true,
    },
    invitedBy: {
      type: String,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'pm_members',
  },
);

// Create unique compound index to prevent duplicate members
MemberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

// Create index for faster queries
MemberSchema.index({ workspaceId: 1 });
MemberSchema.index({ userId: 1 });
