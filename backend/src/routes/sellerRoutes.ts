import { Router } from 'express';
import {
  registerSeller,
  getSellerProfile,
  sellerAddProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  sellerGetProducts,
  sellerGetOrders,
  sellerUpdateOrderStatus,
  sellerGetAnalytics,
} from '../controllers/sellerController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Seller Registration (Self onboarding, initially 'customer')
router.post('/register', protect, registerSeller);

// Seller Dashboard Guard (Requires seller/admin role)
router.use(protect, authorizeRoles('seller', 'admin'));

router.get('/profile', getSellerProfile);
router.get('/analytics', sellerGetAnalytics);

// Product Catalog
router.get('/products', sellerGetProducts);
router.post('/products', sellerAddProduct);
router.put('/products/:productId', sellerUpdateProduct);
router.delete('/products/:productId', sellerDeleteProduct);

// Orders Handling
router.get('/orders', sellerGetOrders);
router.put('/orders/:orderId/status', sellerUpdateOrderStatus);

export default router;
