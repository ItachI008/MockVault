import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import SchemaDefinition from '../models/Schema';
import MockEndpoint from '../models/MockEndpoint';
import SchemaVersion from '../models/SchemaVersion';
import { extractOpenApiEndpoints, parseOpenApiSpec } from '../services/openApi';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/error.middleware';

const router = Router();
router.use(authMiddleware);

const DEFAULT_PROJECT_ID = 'default';

/**
 * Synchronize mock endpoints with the provided OpenAPI spec.
 */
const syncEndpointsForSchema = async (schemaId: string, openapiSpec: string) => {
  const spec = parseOpenApiSpec(openapiSpec);
  const contracts = extractOpenApiEndpoints(spec);

  if (contracts.length === 0) return [];

  const syncedEndpoints = await Promise.all(
    contracts.map((contract) =>
      MockEndpoint.findOneAndUpdate(
        { schemaId, path: contract.path, method: contract.method },
        {
          $set: {
            operationId: contract.operationId,
            summary: contract.summary,
            responseStatus: contract.responseStatus,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    )
  );

  await MockEndpoint.deleteMany({
    schemaId,
    _id: { $nin: syncedEndpoints.map((endpoint) => endpoint._id) },
  });

  return syncedEndpoints;
};

/**
 * @route   GET /api/schemas
 * @desc    Get all schemas for the authenticated user
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const schemas = await SchemaDefinition.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
  res.json(schemas);
}));

/**
 * @route   POST /api/schemas
 * @desc    Create a new schema and generate endpoints
 */
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { name, openapiSpec, version, projectId, changeNote } = req.body;

  if (!name) throw new AppError(400, 'Schema name is required.');
  if (!openapiSpec) throw new AppError(400, 'OpenAPI spec is required.');

  // Validate spec before saving
  parseOpenApiSpec(openapiSpec);

  const schema = await SchemaDefinition.create({
    name,
    userId: req.userId,
    projectId: projectId || DEFAULT_PROJECT_ID,
    openapiSpec,
    version: version || '1.0.0',
  });

  // Create initial version snapshot
  await SchemaVersion.create({
    schemaId: schema._id.toString(),
    userId: req.userId,
    name: schema.name,
    version: schema.version,
    openapiSpec,
    changeNote: changeNote || 'Initial version',
  });

  const endpoints = await syncEndpointsForSchema(schema._id.toString(), openapiSpec);
  res.status(201).json({ schema, endpoints });
}));

/**
 * @route   GET /api/schemas/:id
 * @desc    Get schema details and its endpoints
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid schema id.');

  const schema = await SchemaDefinition.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!schema) throw new AppError(404, 'Schema not found.');

  const endpoints = await MockEndpoint.find({ schemaId: req.params.id }).sort({ path: 1, method: 1 }).lean();
  res.json({ schema, endpoints });
}));

/**
 * @route   PUT /api/schemas/:id
 * @desc    Update schema and sync endpoints
 */
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid schema id.');

  const { name, openapiSpec, version, changeNote } = req.body;
  if (openapiSpec) parseOpenApiSpec(openapiSpec);

  const schema = await SchemaDefinition.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      ...(name ? { name } : {}),
      ...(openapiSpec ? { openapiSpec } : {}),
      ...(version ? { version } : {}),
    },
    { new: true, runValidators: true }
  );

  if (!schema) throw new AppError(404, 'Schema not found.');

  if (openapiSpec) {
    await SchemaVersion.create({
      schemaId: schema._id.toString(),
      userId: req.userId,
      name: schema.name,
      version: schema.version,
      openapiSpec,
      changeNote: changeNote || 'Updated',
    });
  }

  const endpoints = openapiSpec
    ? await syncEndpointsForSchema(schema._id.toString(), openapiSpec)
    : await MockEndpoint.find({ schemaId: schema._id.toString() }).sort({ path: 1, method: 1 });

  res.json({ schema, endpoints });
}));

/**
 * @route   DELETE /api/schemas/:id
 * @desc    Delete schema and all associated data
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid schema id.');

  const schema = await SchemaDefinition.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!schema) throw new AppError(404, 'Schema not found.');

  await Promise.all([
    MockEndpoint.deleteMany({ schemaId: req.params.id }),
    SchemaVersion.deleteMany({ schemaId: req.params.id })
  ]);
  
  res.status(204).send();
}));

/**
 * @route   GET /api/schemas/:id/versions
 * @desc    List all version snapshots for a schema
 */
router.get('/:id/versions', asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid schema id.');

  const schema = await SchemaDefinition.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!schema) throw new AppError(404, 'Schema not found.');

  const versions = await SchemaVersion.find({ schemaId: req.params.id }).sort({ snapshotAt: -1 }).lean();
  res.json(versions);
}));

/**
 * @route   POST /api/schemas/:id/rollback/:versionId
 * @desc    Rollback schema to a specific version snapshot
 */
router.post('/:id/rollback/:versionId', asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.versionId)) {
    throw new AppError(400, 'Invalid identifiers.');
  }

  const schema = await SchemaDefinition.findOne({ _id: req.params.id, userId: req.userId });
  if (!schema) throw new AppError(404, 'Schema not found.');

  const version = await SchemaVersion.findOne({ _id: req.params.versionId, schemaId: req.params.id }).lean();
  if (!version) throw new AppError(404, 'Version snapshot not found.');

  schema.openapiSpec = version.openapiSpec;
  schema.version = version.version;
  await schema.save();

  await SchemaVersion.create({
    schemaId: schema._id.toString(),
    userId: req.userId,
    name: schema.name,
    version: schema.version,
    openapiSpec: version.openapiSpec,
    changeNote: `Rolled back to version ${version.version}`,
  });

  const endpoints = await syncEndpointsForSchema(schema._id.toString(), version.openapiSpec);
  res.json({ schema, endpoints });
}));

export default router;
