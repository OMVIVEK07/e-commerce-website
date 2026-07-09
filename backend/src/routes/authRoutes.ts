import { Router } from 'express';
import { googleLogin, getMe, sendOtp, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/google', googleLogin);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.get('/me', protect, getMe);

export default router;
