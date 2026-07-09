import { Response } from 'express';
import { Seller } from '../models/Seller';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { notifyOrderUpdate } from '../services/socketService';

// --- SELLER ONBOARDING ---
export const registerSeller = async (req: any, res: Response): Promise<void> => {
  try {
    const { companyName, description, phone, address, gstin, bankDetails } = req.body;

    const existing = await Seller.findOne({ user: req.user.id });
    if (existing) {
      res.status(400).json({ success: false, message: 'You have already registered a seller profile' });
      return;
    }

    const seller = await Seller.create({
      user: req.user.id,
      companyName,
      description,
      phone,
      address,
      gstin,
      bankDetails,
      isVerified: false, // Must be approved by Admin
    });

    // Optionally set role to seller or await approval
    await User.findByIdAndUpdate(req.user.id, { role: 'seller' });

    res.status(201).json({
      success: true,
      message: 'Seller registration submitted successfully. Awaiting admin approval.',
      seller,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Seller registration failed' });
  }
};

export const getSellerProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller profile not found' });
      return;
    }
    res.status(200).json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving seller profile' });
  }
};

// --- PRODUCT CATALOG MANAGEMENT ---
export const sellerAddProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller || !seller.isVerified) {
      res.status(403).json({ success: false, message: 'Access denied: Seller account is not verified yet.' });
      return;
    }

    const product = await Product.create({
      ...req.body,
      seller: seller._id,
    });

    res.status(201).json({ success: true, message: 'Product added successfully', product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to add product' });
  }
};

export const sellerUpdateProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(403).json({ success: false, message: 'Access denied: Seller profile not found' });
      return;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, seller: seller._id },
      req.body,
      { new: true }
    );

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found or not owned by you' });
      return;
    }

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const sellerDeleteProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(403).json({ success: false, message: 'Access denied: Seller profile not found' });
      return;
    }

    const product = await Product.findOneAndDelete({ _id: req.params.productId, seller: seller._id });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found or not owned by you' });
      return;
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

export const sellerGetProducts = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(403).json({ success: false, message: 'Access denied: Seller profile not found' });
      return;
    }

    const products = await Product.find({ seller: seller._id }).populate('category');
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
};

// --- ORDER HANDLING ---
export const sellerGetOrders = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(403).json({ success: false, message: 'Access denied: Seller profile not found' });
      return;
    }

    // Retrieve orders that contain at least one item owned by this seller
    const products = await Product.find({ seller: seller._id }).select('_id');
    const productIds = products.map((p) => p._id);

    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('items.product')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve seller orders' });
  }
};

export const sellerUpdateOrderStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { status, description } = req.body;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Check permissions (Make sure this seller actually owns an item in this order)
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(403).json({ success: false, message: 'Seller profile not found' });
      return;
    }

    // Update main tracking timeline
    order.orderStatus = status;
    order.tracking.push({
      status,
      description: description || `Order marked as ${status} by seller`,
      timestamp: new Date(),
    });

    if (status === 'delivered') {
      order.paymentStatus = 'paid';
      
      // Calculate item total for seller revenue increments
      let sellerItemsTotal = 0;
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod && prod.seller.toString() === seller._id.toString()) {
          sellerItemsTotal += item.price * item.quantity;
        }
      }
      // Add revenue to Seller model
      seller.revenue += sellerItemsTotal;
      await seller.save();
    }

    await order.save();
    notifyOrderUpdate(order._id.toString(), status, order);

    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order state' });
  }
};

// --- ANALYTICS ---
export const sellerGetAnalytics = async (req: any, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller not found' });
      return;
    }

    const products = await Product.find({ seller: seller._id });
    const productIds = products.map((p) => p._id);

    // Sum overall items sold and orders count
    const orders = await Order.find({ 'items.product': { $in: productIds } });
    
    let totalItemsSold = 0;
    orders.forEach((o) => {
      o.items.forEach((i) => {
        if (productIds.some((pId) => pId.toString() === i.product.toString())) {
          totalItemsSold += i.quantity;
        }
      });
    });

    // Stock alert list (products with stock <= 5)
    const stockAlerts = products.filter((p) => p.stock <= 5);

    res.status(200).json({
      success: true,
      analytics: {
        totalProducts: products.length,
        revenue: seller.revenue,
        totalItemsSold,
        ordersCount: orders.length,
        stockAlerts,
        rating: seller.rating,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error compiling seller metrics' });
  }
};
