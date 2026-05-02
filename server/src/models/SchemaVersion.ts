import mongoose, { Document, Schema } from 'mongoose';

export interface ISchemaVersion extends Document {
  schemaId: string;
  userId: string;
  name: string;
  version: string;
  openapiSpec: string;
  snapshotAt: Date;
  changeNote?: string;
}

const SchemaVersionSchema = new Schema<ISchemaVersion>(
  {
    schemaId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    openapiSpec: { type: String, required: true },
    snapshotAt: { type: Date, default: Date.now },
    changeNote: { type: String },
  },
  { timestamps: true }
);

SchemaVersionSchema.index({ schemaId: 1, snapshotAt: -1 });

export default mongoose.model<ISchemaVersion>('SchemaVersion', SchemaVersionSchema);
