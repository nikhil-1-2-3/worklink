import express from 'express';
import { getWorkerProfile, updateWorkerProfile, generateDigitalPassport, applyForContractor, createSubWorker, getContractorTeam, searchWorkerByPassport, sendAgencyInvite, getSentInvites, getReceivedInvites, respondToInvite } from '../controllers/workerController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, authorize('worker', 'admin'), getWorkerProfile);
router.put('/profile', protect, authorize('worker'), updateWorkerProfile);
router.post('/passport', protect, authorize('worker'), generateDigitalPassport);

router.post('/contractor/apply', protect, authorize('worker'), applyForContractor);
router.get('/contractor/search-passport', protect, authorize('worker'), searchWorkerByPassport);
router.post('/contractor/invite', protect, authorize('worker'), sendAgencyInvite);
router.get('/contractor/invites-sent', protect, authorize('worker'), getSentInvites);
router.post('/contractor/sub-worker', protect, authorize('worker'), createSubWorker);
router.get('/contractor/team', protect, authorize('worker'), getContractorTeam);

router.get('/invites', protect, authorize('worker'), getReceivedInvites);
router.put('/invites/:id/respond', protect, authorize('worker'), respondToInvite);

export default router;
