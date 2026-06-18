import express from 'express';
import { registerUser, loginUser, submitVerification } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

import { upload } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/submit-verification', protect, upload.single('aadhaarDocument'), submitVerification);

export default router;
