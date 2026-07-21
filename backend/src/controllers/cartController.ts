import { Response } from 'express';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { Coupon } from '../models/Coupon';
import { Product } from '../models/Product';

// --- CART OPERATIONS ---
export const getCart = async (req: any, res: Response): Promise<void> => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve cart' });
  }
};

export const addToCart = async (req: any, res: Response): Promise<void> => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Verify stock availability
    if (product.stock < quantity) {
      res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
      return;
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item with exact same variant is already in cart
    const itemIndex = cart.items.findIndex(
      (item: any) =>
        (item.product._id ? item.product._id.toString() : item.product.toString()) === productId &&
        (!variant ||
          (item.variant?.color === variant.color &&
            item.variant?.size === variant.size &&
            item.variant?.weight === variant.weight))
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity), variant });
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

export const updateCartItemQuantity = async (req: any, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (Number(quantity) < 1) {
      res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      return;
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    const item = cart.items.find((i: any) => i._id.toString() === itemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Cart item not found' });
      return;
    }

    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ success: false, message: 'Requested quantity exceeds stock limits' });
      return;
    }

    item.quantity = Number(quantity);
    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item quantity' });
  }
};

export const removeFromCart = async (req: any, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter((item: any) => item._id.toString() !== itemId);
    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
};

// --- WISHLIST OPERATIONS ---
export const getWishlist = async (req: any, res: Response): Promise<void> => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }
    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve wishlist' });
  }
};

export const toggleWishlist = async (req: any, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isAdded = false;

    if (index === -1) {
      wishlist.products.push(productId);
      isAdded = true;
    } else {
      wishlist.products.splice(index, 1);
    }

    await wishlist.save();
    const populated = await wishlist.populate('products');

    res.status(200).json({ success: true, wishlist: populated, isAdded });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to modify wishlist' });
  }
};

// --- COUPON VALIDATION ---
export const validateCoupon = async (req: any, res: Response): Promise<void> => {
  try {
    const { code, cartSubtotal } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
      return;
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      res.status(400).json({ success: false, message: 'Coupon code has expired' });
      return;
    }

    // Check min purchase threshold
    if (Number(cartSubtotal) < coupon.minPurchase) {
      res.status(400).json({
        success: false,
        message: `Minimum purchase of INR ${coupon.minPurchase} is required to use this coupon`,
      });
      return;
    }

    // Check if already used by this user
    if (coupon.usedBy.includes(req.user.id)) {
      res.status(400).json({ success: false, message: 'You have already redeemed this coupon code' });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Number(cartSubtotal) * (coupon.discountAmount / 100);
    } else {
      discountAmount = coupon.discountAmount;
    }

    // Cap discount amount to subtotal
    discountAmount = Math.min(discountAmount, Number(cartSubtotal));

    res.status(200).json({
      success: true,
      message: 'Coupon code validated successfully',
      discountAmount: Number(discountAmount.toFixed(2)),
      code: coupon.code,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking coupon validation' });
  }
};
