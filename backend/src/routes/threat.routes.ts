import { Router } from 'express';
import {
  getThreats,
  getThreatById,
  updateThreatStatus,
  addMitigationAction,
  getThreatStatistics,
  analyzeThreat,
} from '../controllers/threat.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { assessRisk } from '../middleware/risk.middleware';

const router = Router();

// All threat routes require authentication
router.use(authenticate);

// Admin and security analyst routes
router.get('/', authorize('admin', 'analyst'), assessRisk(), getThreats);
router.get('/statistics', authorize('admin', 'analyst'), getThreatStatistics);
router.get('/:threatId', authorize('admin', 'analyst'), getThreatById);
router.post('/:threatId/analyze', authorize('admin', 'analyst'), analyzeThreat);
router.put('/:threatId/status', authorize('admin'), updateThreatStatus);
router.post('/:threatId/mitigate', authorize('admin'), addMitigationAction);

export default router;