import mongoose, { Document, Schema } from 'mongoose';

export interface IMockEndpoint extends Document {
  schemaId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  operationId?: string;
  summary?: string;
  responseStatus: string;
  latencyMs: number;
  errorRate: number;
  isActive: boolean;
  authRequired: 'None' | 'Bearer' | 'API Key';
}

const MockEndpointSchema = new Schema<IMockEndpoint>(
  {
    schemaId: { type: String, required: true },
    path: { type: String, required: true },
    method: { type: String, required: true, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
    operationId: { type: String },
    summary: { type: String },
    responseStatus: { type: String, default: '200' },
    latencyMs: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    authRequired: { type: String, default: 'None', enum: ['None', 'Bearer', 'API Key'] },
  },
  { timestamps: true }
);

MockEndpointSchema.index({ schemaId: 1, path: 1, method: 1 }, { unique: true });

export default mongoose.model<IMockEndpoint>('MockEndpoint', MockEndpointSchema);
