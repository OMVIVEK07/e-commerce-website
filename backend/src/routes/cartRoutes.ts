import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  getWishlist,
  toggleWishlist,
  validateCoupon,
} from '../controllers/cartController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Apply auth protection to all cart/wishlist routes
router.use(protect);

// Cart
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update/:itemId', updateCartItemQuantity);
router.delete('/remove/:itemId', removeFromCart);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist/toggle', toggleWishlist);

// Coupon Validate
router.post('/coupon/validate', validateCoupon);

export default router;
