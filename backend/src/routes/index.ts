import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';
import sellerRoutes from './sellerRoutes';
import adminRoutes from './adminRoutes';
import supportRoutes from './supportRoutes';

import { seedDatabase } from '../controllers/seedController';

const router = Router();

// Mount Routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);

// Database Seeding Trigger Route
router.get('/seed', seedDatabase);
router.post('/seed', seedDatabase);

// Health Check Route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

export default router;
