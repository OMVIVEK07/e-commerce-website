import { Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Payment } from '../models/Payment';
import { Address } from '../models/Address';
import { Cart } from '../models/Cart';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { Analytics } from '../models/Analytics';
import {
  createStripePaymentIntent,
  createRazorpayOrder,
  refundStripePayment,
  refundRazorpayPayment,
} from '../services/paymentService';
import { generateInvoicePDF } from '../services/pdfService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { notifyOrderUpdate, notifyUser, notifyInventoryAlert } from '../services/socketService';

// Helper to calculate total costs
const calculateOrderSummary = async (items: any[], couponCode?: string) => {
  let subtotal = 0;

  for (const item of items) {
    const prodId = item.product?._id || item.product;
    const product = await Product.findById(prodId);
    if (!product) throw new Error('Product not found');
    subtotal += product.price * item.quantity;
  }

  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && new Date() <= coupon.expiryDate && subtotal >= coupon.minPurchase) {
      if (coupon.discountType === 'percentage') {
        discountAmount = subtotal * (coupon.discountAmount / 100);
      } else {
        discountAmount = coupon.discountAmount;
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const netPayable = Math.max(subtotal - discountAmount, 0);
  const gst = netPayable - netPayable / 1.18; // Inclusive 18% GST (Amazon/Flipkart standard)
  const shippingCharges = netPayable > 999 || netPayable === 0 ? 0 : 99; // Free shipping over INR 999
  const grandTotal = netPayable + shippingCharges;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    shippingCharges: Number(shippingCharges.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
};

// --- ADDRESS CRUD ---
export const getAddresses = async (req: any, res: Response): Promise<void> => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve addresses' });
  }
};

export const addAddress = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, phone, alternatePhone, streetAddress, city, state, postalCode, country, addressType, isDefault } = req.body;

    if (isDefault) {
      // reset existing default addresses
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      name,
      phone,
      alternatePhone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault: !!isDefault,
    });

    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
};

export const updateAddress = async (req: any, res: Response): Promise<void> => {
  try {
    const { isDefault } = req.body;
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.addressId, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found' });
      return;
    }
    res.status(200).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

export const deleteAddress = async (req: any, res: Response): Promise<void> => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.addressId, user: req.user.id });
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

// --- CHECKOUT ROUTINES ---
export const initializeCheckoutPayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { provider, items, couponCode } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart items are empty' });
      return;
    }

    const { grandTotal } = await calculateOrderSummary(items, couponCode);

    if (provider === 'stripe') {
      const intent = await createStripePaymentIntent(grandTotal);
      res.status(200).json({ success: true, paymentData: intent });
    } else if (provider === 'razorpay') {
      const orderId = `receipt_${Math.random().toString(36).substring(2, 8)}`;
      const order = await createRazorpayOrder(grandTotal, 'INR', orderId);
      res.status(200).json({ success: true, paymentData: order });
    } else {
      res.status(400).json({ success: false, message: 'Unsupported payment gateway provider' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Checkout initiation failed' });
  }
};

// --- PLACE ORDER ---
export const placeOrder = async (req: any, res: Response): Promise<void> => {
  try {
    const {
      items,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      paymentStatus,
      transactionId,
      couponApplied,
    } = req.body;

    // Fetch addresses
    const shipping = await Address.findById(shippingAddressId);
    const billing = await Address.findById(billingAddressId);

    if (!shipping || !billing) {
      res.status(404).json({ success: false, message: 'Shipping or Billing Address not found' });
      return;
    }

    // Verify stock availability
    for (const item of items) {
      const prodId = item.product?._id || item.product;
      const product = await Product.findById(prodId);
      if (!product || product.stock < item.quantity) {
        res.status(400).json({ success: false, message: `Product ${product?.name || 'Item'} is out of stock` });
        return;
      }
    }

    // Calculations
    const summary = await calculateOrderSummary(items, couponApplied);

    // Save order
    const order = new Order({
      customer: req.user.id,
      items: items.map((i: any) => {
        const prodId = i.product?._id || i.product;
        const price = i.price !== undefined ? i.price : i.product?.price;
        return {
          product: prodId,
          quantity: i.quantity,
          selectedVariant: i.selectedVariant,
          price: price,
        };
      }),
      shippingAddress: {
        name: shipping.name,
        phone: shipping.phone,
        alternatePhone: shipping.alternatePhone,
        streetAddress: shipping.streetAddress,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
      },
      billingAddress: {
        name: billing.name,
        phone: billing.phone,
        alternatePhone: billing.alternatePhone,
        streetAddress: billing.streetAddress,
        city: billing.city,
        state: billing.state,
        postalCode: billing.postalCode,
        country: billing.country,
      },
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      orderStatus: paymentStatus === 'paid' ? 'processed' : 'pending',
      tracking: [
        {
          status: paymentStatus === 'paid' ? 'processed' : 'pending',
          description: paymentStatus === 'paid'
            ? 'Order payment confirmed. Order is being processed.'
            : 'Order has been placed and is waiting processing.',
        }
      ],
      discountAmount: summary.discountAmount,
      couponApplied,
      gst: summary.gst,
      shippingCharges: summary.shippingCharges,
      grandTotal: summary.grandTotal,
    });

    await order.save();

    // Create payment entry
    if (transactionId) {
      await Payment.create({
        order: order._id,
        amount: order.grandTotal,
        provider: paymentMethod,
        status: paymentStatus === 'paid' ? 'succeeded' : 'pending',
        transactionId,
      });
    }

    // Deduct stock levels and save
    for (const item of items) {
      const prodId = item.product?._id || item.product;
      const product = await Product.findById(prodId);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
        notifyInventoryAlert(product._id.toString(), product.stock);
      }
    }

    // Mark Coupon as used if applied
    if (couponApplied) {
      await Coupon.findOneAndUpdate({ code: couponApplied.toUpperCase() }, { $push: { usedBy: req.user.id } });
    }

    // Add loyalty points to customer (1 point per INR 100 spent)
    const earnedPoints = Math.floor(order.grandTotal / 100);
    await User.findByIdAndUpdate(req.user.id, { $inc: { loyaltyPoints: earnedPoints } });

    // Empty User Cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    // Populate order items for PDF invoice & Email notifications
    const populatedOrder = await order.populate('items.product');

    // Generate Invoice PDF & Email PDF attachment
    try {
      const pdfBuffer = await generateInvoicePDF(populatedOrder);
      await sendOrderConfirmationEmail(req.user.email, populatedOrder, pdfBuffer);
    } catch (pdfErr) {
      console.error('[Invoice Generation/Email Error]:', pdfErr);
    }

    // Log Analytics stats
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      await Analytics.findOneAndUpdate(
        { date: dateStr },
        {
          $inc: {
            totalSales: order.grandTotal,
            ordersCount: 1,
            unitsSold: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
          },
        },
        { upsert: true }
      );
    } catch (analyticsErr) {
      console.error('[Analytics Update Error]:', analyticsErr);
    }

    // Real-Time Socket Notification
    notifyUser(req.user.id, 'order_created', { orderId: order._id, grandTotal: order.grandTotal });

    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('[Place Order Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to place order' });
  }
};

// --- CUSTOMER ORDERS ---
export const getCustomerOrders = async (req: any, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve order history' });
  }
};

export const getOrderById = async (req: any, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, customer: req.user.id }).populate('items.product');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order' });
  }
};

export const cancelOrder = async (req: any, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, customer: req.user.id });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${order.orderStatus}` });
      return;
    }

    // Update order status
    order.orderStatus = 'cancelled';
    order.paymentStatus = 'refunded';
    order.tracking.push({ status: 'cancelled', description: 'Order was cancelled by the customer.', timestamp: new Date() });
    await order.save();

    // Restore stock levels
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    // Refund Payments logs
    const payment = await Payment.findOne({ order: order._id });
    if (payment && payment.status === 'succeeded') {
      try {
        if (payment.provider === 'stripe') {
          await refundStripePayment(payment.transactionId, payment.amount);
        } else if (payment.provider === 'razorpay') {
          await refundRazorpayPayment(payment.transactionId, payment.amount);
        }
        payment.status = 'refunded';
        payment.refundDetails = {
          refundId: `ref_${Math.random().toString(36).substring(2, 8)}`,
          amountRefunded: payment.amount,
          reason: 'Customer cancelled the order',
          refundedAt: new Date(),
        };
        await payment.save();
      } catch (refundError) {
        console.error('[Refund Trigger Error]:', refundError);
      }
    }

    notifyOrderUpdate(order._id.toString(), 'cancelled', order);

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

export const requestOrderReturn = async (req: any, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, customer: req.user.id });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.orderStatus !== 'delivered') {
      res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
      return;
    }

    order.orderStatus = 'returned';
    order.paymentStatus = 'refunded';
    order.tracking.push({ status: 'returned', description: 'Return request submitted and approved.', timestamp: new Date() });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    // Handle Payment Refund
    const payment = await Payment.findOne({ order: order._id });
    if (payment && payment.status === 'succeeded') {
      try {
        if (payment.provider === 'stripe') {
          await refundStripePayment(payment.transactionId, payment.amount);
        } else if (payment.provider === 'razorpay') {
          await refundRazorpayPayment(payment.transactionId, payment.amount);
        }
        payment.status = 'refunded';
        payment.refundDetails = {
          refundId: `ref_${Math.random().toString(36).substring(2, 8)}`,
          amountRefunded: payment.amount,
          reason: 'Customer requested order return',
          refundedAt: new Date(),
        };
        await payment.save();
      } catch (refundError) {
        console.error('[Return Refund Error]:', refundError);
      }
    }

    notifyOrderUpdate(order._id.toString(), 'returned', order);

    res.status(200).json({ success: true, message: 'Return order processed and refunded successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to request order return' });
  }
};

export const downloadInvoicePDF = async (req: any, res: Response): Promise<void> => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.orderId }
      : { _id: req.params.orderId, customer: req.user.id };

    const order = await Order.findOne(query).populate('items.product');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const pdfBuffer = await generateInvoicePDF(order);
    const invoiceId = `INV-${order._id.toString().substring(18).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to download invoice' });
  }
};
