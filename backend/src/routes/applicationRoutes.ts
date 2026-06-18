import express from 'express';
import { applyForJob, getWorkerApplications, cancelApplication, getJobApplicants, updateApplicationStatus, updateWorkerStatus, leaveReview, workerLeaveReview } from '../controllers/applicationController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// Worker routes
router.post('/job/:jobId/apply', protect, authorize('worker'), applyForJob);
router.get('/worker', protect, authorize('worker'), getWorkerApplications);
router.put('/:id/cancel', protect, authorize('worker'), cancelApplication);
router.put('/:id/worker-status', protect, authorize('worker'), updateWorkerStatus);
router.post('/:id/worker-review', protect, authorize('worker'), workerLeaveReview);

// Employer routes
router.get('/job/:jobId', protect, authorize('employer', 'admin'), getJobApplicants);
router.put('/:id/status', protect, authorize('employer', 'admin'), updateApplicationStatus);
router.post('/:id/review', protect, authorize('employer', 'admin'), leaveReview);

export default router;
