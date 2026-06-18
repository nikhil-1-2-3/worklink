import express from 'express';
import { getPendingVerifications, verifyUser, getAllWorkers, getAllEmployers, getPendingContractors, approveContractor } from '../controllers/adminController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/verifications/pending', getPendingVerifications);
router.put('/verifications/:id', verifyUser);

router.get('/workers', getAllWorkers);
router.get('/employers', getAllEmployers);

router.get('/contractors/pending', getPendingContractors);
router.put('/contractors/:id/approve', approveContractor);

export default router;
