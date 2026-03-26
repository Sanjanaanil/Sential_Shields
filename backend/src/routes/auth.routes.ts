import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { assessRisk, trackInteraction } from '../middleware/risk.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', trackInteraction('login'), login);
router.post('/logout', authenticate, logout);

// Protected routes
router.get('/me', authenticate, assessRisk(), getCurrentUser);

export default router;