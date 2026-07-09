import { Router } from 'express';
import {
  adminGetStats,
  adminGetUsers,
  adminToggleBlockUser,
  adminGetSellers,
  adminVerifySeller,
  adminGetOrders,
  adminGetCoupons,
  adminCreateCoupon,
  adminDeleteCoupon,
} from '../controllers/adminController';
import { seedDatabase } from '../controllers/seedController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Secure admin routes
router.use(protect, authorizeRoles('admin'));

// Seeding
router.post('/seed', seedDatabase);

// Analytics Dashboard Stats
router.get('/stats', adminGetStats);

// Moderation
router.get('/users', adminGetUsers);
router.post('/users/:userId/toggle-block', adminToggleBlockUser);

// Merchants Approvals
router.get('/sellers', adminGetSellers);
router.put('/sellers/:sellerId/verify', adminVerifySeller);

// Orders logs
router.get('/orders', adminGetOrders);

// Coupon Codes
router.get('/coupons', adminGetCoupons);
router.post('/coupons', adminCreateCoupon);
router.delete('/coupons/:couponId', adminDeleteCoupon);

export default router;
