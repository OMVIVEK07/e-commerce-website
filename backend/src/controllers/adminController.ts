import { Request, Response } from 'express';
import { User } from '../models/User';
import { Seller } from '../models/Seller';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Coupon } from '../models/Coupon';
import { Analytics } from '../models/Analytics';

// --- SYSTEM ANALYTICS STATS ---
export const adminGetStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSellers = await Seller.countDocuments();

    // Aggregates total payment revenue
    const payments = await Payment.find({ status: 'succeeded' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Fetch past 7 days of daily analytics
    const chartData = await Analytics.find().sort({ date: 1 }).limit(7);

    // Fetch top selling products (simple query)
    const topProducts = await Product.find().sort({ rating: -1, reviewsCount: -1 }).limit(5);

    // Fetch top sellers
    const topSellers = await Seller.find().sort({ revenue: -1 }).limit(5).populate('user', 'name email');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSellers,
        totalRevenue,
        chartData,
        topProducts,
        topSellers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compile admin stats' });
  }
};

// --- USER MODERATION ---
export const adminGetUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load user list' });
  }
};

export const adminToggleBlockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot block administrative accounts' });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User was successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle block status' });
  }
};

// --- SELLER APPROVALS ---
export const adminGetSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellers = await Seller.find().populate('user', 'name email profilePic').sort({ createdAt: -1 });
    res.status(200).json({ success: true, sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load seller list' });
  }
};

export const adminVerifySeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body;

    const seller = await Seller.findById(req.params.sellerId);
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller profile not found' });
      return;
    }

    seller.isVerified = !!isVerified;
    await seller.save();

    // If verified, upgrade corresponding User role just in case
    if (isVerified) {
      await User.findByIdAndUpdate(seller.user, { role: 'seller' });
    }

    res.status(200).json({
      success: true,
      message: `Seller verification status set to ${isVerified}`,
      seller,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update seller verification status' });
  }
};

// --- GLOBAL ORDERS & REFUND LOGIC ---
export const adminGetOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve order logs' });
  }
};

// --- COUPON CODES MANAGER ---
export const adminGetCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupon listing' });
  }
};

export const adminCreateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountAmount, minPurchase, expiryDate } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Coupon code already exists' });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountAmount,
      minPurchase: minPurchase || 0,
      expiryDate,
      isActive: true,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Coupon creation failed' });
  }
};

export const adminDeleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Coupon code deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Coupon deletion failed' });
  }
};
