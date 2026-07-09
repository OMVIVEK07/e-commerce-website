import { Router } from 'express';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  initializeCheckoutPayment,
  placeOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder,
  requestOrderReturn,
  downloadInvoicePDF,
} from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Apply auth check
router.use(protect);

// Addresses CRUD
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Checkout & Placements
router.post('/checkout/initiate', initializeCheckoutPayment);
router.post('/place', placeOrder);

// Orders Queries
router.get('/list', getCustomerOrders);
router.get('/detail/:orderId', getOrderById);
router.get('/invoice/:orderId', downloadInvoicePDF);
router.post('/cancel/:orderId', cancelOrder);
router.post('/return/:orderId', requestOrderReturn);

export default router;
