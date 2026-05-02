import { Router } from 'express';
import SchemaDefinition from '../models/Schema';
import MockEndpoint from '../models/MockEndpoint';
import { buildContractReport } from '../services/contractReport';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userSchemas = await SchemaDefinition.find({ userId: req.userId }).select('_id').lean();
    const userSchemaIds = userSchemas.map((s) => s._id.toString());

    const [schemaCount, endpointCount, activeEndpointCount, endpoints, contractReport] = await Promise.all([
      SchemaDefinition.countDocuments({ userId: req.userId }),
      MockEndpoint.countDocuments({ schemaId: { $in: userSchemaIds } }),
      MockEndpoint.countDocuments({ schemaId: { $in: userSchemaIds }, isActive: true }),
      MockEndpoint.find({ schemaId: { $in: userSchemaIds } }).sort({ updatedAt: -1 }).limit(8).lean(),
      buildContractReport(req.userId),
    ]);

    res.json({
      metrics: {
        schemaCount,
        endpointCount,
        activeEndpointCount,
        contractPassRate: contractReport.passRate,
      },
      endpoints,
      contractReport,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
