import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import MockEndpoint from '../models/MockEndpoint';
import SchemaDefinition from '../models/Schema';
import { generateMockData } from '../services/mockGenerator';
import { getEndpointContract, matchesOpenApiPath, parseOpenApiSpec } from '../services/openApi';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/error.middleware';

const router = Router();

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalizeLivePath = (endpoint: string | undefined) => {
  if (!endpoint) return '/';
  return `/${endpoint}`.replace(/\/+/g, '/');
};

/**
 * @route   GET /api/mocks
 * @desc    List all mock endpoints for the authenticated user
 */
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  const userSchemas = await SchemaDefinition.find({ userId: req.userId }).select('_id name').lean();
  const userSchemaIds = userSchemas.map((s) => s._id.toString());
  const schemaNameById = new Map(userSchemas.map((s) => [s._id.toString(), s.name]));

  const endpoints = await MockEndpoint.find({ schemaId: { $in: userSchemaIds } })
    .sort({ updatedAt: -1 })
    .lean();

  res.json(
    endpoints.map((endpoint) => ({
      ...endpoint,
      schemaName: schemaNameById.get(endpoint.schemaId) || 'Unknown schema',
    }))
  );
}));

/**
 * @route   PATCH /api/mocks/:id
 * @desc    Update mock endpoint configuration
 */
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid mock endpoint id.');

  const endpoint = await MockEndpoint.findById(req.params.id).lean();
  if (!endpoint) throw new AppError(404, 'Mock endpoint not found.');

  const schema = await SchemaDefinition.findOne({ _id: endpoint.schemaId, userId: req.userId }).lean();
  if (!schema) throw new AppError(403, 'Access denied.');

  const allowedUpdates = ['latencyMs', 'errorRate', 'isActive', 'authRequired'] as const;
  const update = Object.fromEntries(
    allowedUpdates
      .filter((field) => req.body[field] !== undefined)
      .map((field) => {
        if (field === 'latencyMs') return [field, Math.max(0, Number(req.body[field]) || 0)];
        if (field === 'errorRate') return [field, Math.min(100, Math.max(0, Number(req.body[field]) || 0))];
        return [field, req.body[field]];
      })
  );

  const updated = await MockEndpoint.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!updated) throw new AppError(404, 'Mock endpoint not found.');

  res.json(updated);
}));

/**
 * @route   ALL /api/mocks/live/:endpoint
 * @desc    Serve live mock responses based on saved OpenAPI contracts
 */
router.all('/live/:endpoint(*)', asyncHandler(async (req: any, res: any) => {
  const io = (req as any).io;
  const livePath = normalizeLivePath(req.params.endpoint);
  
  const endpoints = await MockEndpoint.find({ method: req.method.toUpperCase(), isActive: true }).lean();
  const endpoint = endpoints.find((candidate) => matchesOpenApiPath(candidate.path, livePath));

  if (!endpoint) {
    throw new AppError(404, `No active ${req.method.toUpperCase()} mock endpoint is configured for ${livePath}.`);
  }

  // Auth Checks
  if (endpoint.authRequired === 'Bearer' && !req.header('authorization')?.startsWith('Bearer ')) {
    throw new AppError(401, 'Bearer token is required for this mock endpoint.');
  }

  if (endpoint.authRequired === 'API Key' && !req.header('x-api-key')) {
    throw new AppError(401, 'x-api-key header is required for this mock endpoint.');
  }

  const startTime = Date.now();
  if (endpoint.latencyMs > 0) await wait(endpoint.latencyMs);

  // Simulated Errors
  if (endpoint.errorRate > 0 && Math.random() * 100 < endpoint.errorRate) {
    if (io) {
      io.emit('mock:hit', {
        method: req.method.toUpperCase(),
        path: livePath,
        statusCode: 503,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: true,
      });
    }
    throw new AppError(503, 'Simulated upstream failure.');
  }

  const schema = await SchemaDefinition.findById(endpoint.schemaId).lean();
  if (!schema) throw new AppError(404, 'Schema definition not found.');

  const spec = parseOpenApiSpec(schema.openapiSpec);
  const contract = getEndpointContract(spec, endpoint.path, endpoint.method);
  if (!contract) throw new AppError(404, 'Response schema not found in contract.');

  const responseStatus = Number(contract.responseStatus);
  const statusCode = Number.isInteger(responseStatus) && responseStatus >= 100 && responseStatus <= 599 ? responseStatus : 200;
  const responseData = generateMockData(contract.responseSchema);

  // Real-time Logging
  if (io) {
    io.emit('mock:hit', {
      method: req.method.toUpperCase(),
      path: livePath,
      statusCode,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: false,
    });
  }

  res.status(statusCode).json(responseData);
}));

export default router;
