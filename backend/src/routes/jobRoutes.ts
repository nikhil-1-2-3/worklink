import express from 'express';
import { createJob, getNearbyJobs, getAllJobs, getEmployerJobs, getMatchedJobs } from '../controllers/jobController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', getAllJobs);
router.get('/nearby', getNearbyJobs);
router.get('/match', protect, authorize('worker'), getMatchedJobs);
router.get('/employer', protect, authorize('employer', 'admin'), getEmployerJobs);
router.post('/', protect, authorize('employer', 'admin'), createJob);

export default router;
