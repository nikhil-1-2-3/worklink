import express from 'express';
import { getEmployerProfile, updateEmployerProfile, getEmployerStats, getEmployerPublicProfile } from '../controllers/employerController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, authorize('employer'), getEmployerProfile);
router.put('/profile', protect, authorize('employer'), updateEmployerProfile);
router.get('/stats', protect, authorize('employer'), getEmployerStats);
router.get('/public/:id', protect, getEmployerPublicProfile);

export default router;
