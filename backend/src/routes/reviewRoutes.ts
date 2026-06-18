import express from 'express';
import { createReview, getWorkerReviews } from '../controllers/reviewController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, authorize('employer'), createReview);
router.get('/worker/:workerId', getWorkerReviews);

export default router;
