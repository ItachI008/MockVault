import mongoose, { Document, Schema } from 'mongoose';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface IWorkspace extends Document {
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceMember extends Document {
  workspaceId: string;
  userId: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  invitedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true },
  },
  { timestamps: true }
);

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
    invitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export const WorkspaceMember = mongoose.model<IWorkspaceMember>('WorkspaceMember', WorkspaceMemberSchema);
