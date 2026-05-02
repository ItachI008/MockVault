import { Router } from 'express';
import { buildContractReport } from '../services/contractReport';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/report', async (req: AuthRequest, res) => {
  try {
    res.json(await buildContractReport(req.userId));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
