import mongoose, { Document, Schema } from 'mongoose';

export interface ISchema extends Document {
  name: string;
  userId: string;
  projectId: string;
  openapiSpec: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchemaDefinitionSchema = new Schema<ISchema>(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    projectId: { type: String, required: true },
    openapiSpec: { type: String, required: true },
    version: { type: String, default: '1.0.0' },
  },
  { timestamps: true }
);

SchemaDefinitionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<ISchema>('SchemaDefinition', SchemaDefinitionSchema);
