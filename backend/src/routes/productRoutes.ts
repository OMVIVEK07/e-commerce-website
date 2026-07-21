import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getCategories,
  createCategory,
  addProductReview,
  markReviewHelpful,
  getRecommendations,
  checkPincode,
  getSearchSuggestions,
} from '../controllers/productController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', protect, authorizeRoles('admin'), createCategory);

// Pincode & Suggestions
router.get('/pincode/check', checkPincode);
router.post('/pincode/check', checkPincode);
router.get('/suggestions', getSearchSuggestions);

// Products
router.get('/list', getProducts);
router.get('/recommendations', getRecommendations);
router.get('/item/:id', getProductById);

// Reviews
router.post('/item/:id/review', protect, addProductReview);
router.post('/review/:reviewId/helpful', protect, markReviewHelpful);

export default router;
