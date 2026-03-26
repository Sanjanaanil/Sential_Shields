import { Router } from 'express';
import {
  createDecoy,
  getDecoys,
  getDecoyById,
  triggerDecoy,
  updateDecoyStatus,
  deleteDecoy,
  getDecoyStatistics,
  getDecoyTriggerHistory,
} from '../controllers/decoy.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { assessRisk } from '../middleware/risk.middleware';

const router = Router();

// All decoy routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), createDecoy);
router.put('/:decoyId/status', authorize('admin'), updateDecoyStatus);
router.delete('/:decoyId', authorize('admin'), deleteDecoy);
router.get('/statistics', authorize('admin'), getDecoyStatistics);

// Routes accessible by authenticated users with risk assessment
router.get('/', assessRisk(), getDecoys);
router.get('/:decoyId', assessRisk(), getDecoyById);
router.get('/:decoyId/triggers', assessRisk(), getDecoyTriggerHistory);
router.post('/:decoyId/trigger', assessRisk(), triggerDecoy);

export default router;