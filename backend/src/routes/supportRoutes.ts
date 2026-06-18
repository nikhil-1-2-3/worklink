import express from 'express';
import { requestCallback, getCallbacks, resolveCallback } from '../controllers/supportController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// Public route for landing page
router.post('/callback', requestCallback);

// Admin routes for CRM
router.get('/callbacks', protect, authorize('admin'), getCallbacks);
router.put('/callback/:id/resolve', protect, authorize('admin'), resolveCallback);

export default router;
