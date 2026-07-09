'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setCart, applyCoupon, removeCoupon } from '../../store/cartSlice';
import api from '../../services/api';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Ticket, AlertCircle, CheckCircle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cart = useSelector((state: RootState) => state.cart);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Cart details from server on mount
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCart = async () => {
        try {
          const res = await api.get('/cart');
          if (res.data.success) {
            dispatch(setCart(res.data.cart.items));
          }
        } catch (err) {
          console.error('[Fetch Cart Error]:', err);
        }
      };
      fetchCart();
    }
  }, [isAuthenticated, dispatch]);

  const updateQuantity = async (itemId: string, currentQty: number, offset: number) => {
    const targetQty = currentQty + offset;
    if (targetQty < 1) return;

    try {
      const res = await api.put(`/cart/update/${itemId}`, { quantity: targetQty });
      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update item quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await api.delete(`/cart/remove/${itemId}`);
      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      }
    } catch (err) {
      alert('Failed to remove item from cart');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.post('/cart/coupon/validate', {
        code: couponInput,
        cartSubtotal: cart.subtotal,
      });

      if (res.data.success) {
        dispatch(
          applyCoupon({
            code: res.data.code,
            discountAmount: res.data.discountAmount,
          })
        );
        setCouponInput('');
        alert('Coupon applied successfully!');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto animate-bounce" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-350">Your Cart is Locked</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Please log in to synchronize your shopping basket, track pricing, and claim welcome coupons.
        </p>
        <Link href="/login" className="inline-block bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-8 py-3 rounded-md text-xs transition uppercase tracking-wider">
          Sign In / Register
        </Link>
      </div>
    );
  }

  const qualifiesForFreeShipping = cart.subtotal >= 999;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans text-slate-800">
      {/* Free shipping banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-start gap-3 shadow-2xs mb-6">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          {qualifiesForFreeShipping ? (
            <>
              <p className="font-extrabold text-green-600">Your order qualifies for FREE Delivery.</p>
              <p className="text-slate-400 font-semibold">Select this option at checkout. Details</p>
            </>
          ) : (
            <>
              <p className="font-extrabold text-amber-600">Add ₹{(999 - cart.subtotal).toFixed(0)} more to get FREE Delivery.</p>
              <p className="text-slate-400 font-semibold">Free shipping applies on orders above ₹999.</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SHOPPING CART ITEMS LIST */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-2xs h-fit space-y-4">
          <div className="flex justify-between items-baseline border-b border-slate-150 dark:border-slate-800 pb-3">
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Shopping Cart
            </h1>
            <span className="text-xs text-[#007185] hover:underline cursor-pointer font-bold">Deselect all items</span>
          </div>

          {cart.items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto" />
              <h2 className="text-base font-black text-slate-700 dark:text-slate-350">Your Shopping Basket is Empty</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Discover premium deals on devices, smart accessories, and electronics.</p>
              <Link href="/products" className="inline-block bg-[#FFD814] hover:bg-[#F7CA00] border border-[#F2C200] text-[#111] font-bold px-6 py-2.5 rounded-md text-xs transition shadow-2xs">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-150 dark:divide-slate-800">
              {cart.items.map((item: any) => {
                const discountedPrice = item.product.price * (1 - item.product.discount / 100);
                return (
                  <div
                    key={item._id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5 items-start justify-between"
                  >
                    {/* Item Image */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-150 dark:border-slate-800">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Descriptions */}
                    <div className="flex-grow space-y-2 min-w-0">
                      <div>
                        <span className="text-[9px] uppercase font-black text-[#007185] hover:underline tracking-wider cursor-pointer">
                          {item.product.brand}
                        </span>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 hover:text-orange-600 truncate mt-0.5">
                          <Link href={`/product/${item.product._id}`}>{item.product.name}</Link>
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="text-green-600 font-extrabold">In Stock</span>
                        <span className="text-slate-300">|</span>
                        {item.variant && (
                          <span className="text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                            SKU Variant: {item.variant.color} {item.variant.size ? `/ ${item.variant.size}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Quantity Incrementor panel */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity, -1)}
                            className="p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity, 1)}
                            className="p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="text-[10px] font-bold text-red-650 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Price panel */}
                    <div className="text-right sm:w-28 shrink-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        ₹{(discountedPrice * item.quantity).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">₹{discountedPrice.toFixed(0)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: OFFERS, COUPONS, BILLING BREAKDOWN */}
        <div className="lg:col-span-4 space-y-6">
          {/* Promo Coupons box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-orange-500" />
              <span>Apply Coupons & Promo codes</span>
            </h3>
            
            {cart.couponCode ? (
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/20 border border-orange-200 p-3 rounded-md">
                <div className="text-xs">
                  <p className="font-extrabold text-orange-700">CODE: {cart.couponCode}</p>
                  <p className="text-[10px] text-[#e48800] mt-0.5">Discount of ₹{cart.discountAmount.toFixed(0)} applied</p>
                </div>
                <button
                  onClick={() => dispatch(removeCoupon())}
                  className="text-[10px] text-red-600 font-extrabold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-2 text-xs font-bold uppercase outline-hidden"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="bg-slate-805 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-md text-xs transition"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && (
              <div className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{couponError}</span>
              </div>
            )}
          </div>

          {/* Pricing calculations details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-4 shadow-2xs">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Subtotal Details</h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-400 font-semibold">Subtotal ({cart.items.length} items)</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">₹{cart.subtotal.toFixed(0)}</span>
              </div>
              {cart.discountAmount > 0 && (
                <div className="flex justify-between py-2.5 text-green-600 font-extrabold">
                  <span>Coupon Discount</span>
                  <span>- ₹{cart.discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <span className="text-slate-400 font-semibold">Estimated Shipping</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {cart.shippingCharges === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `₹${cart.shippingCharges.toFixed(0)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between py-3.5 text-sm font-black border-t border-slate-100 dark:border-slate-800">
                <span>Grand Total</span>
                <span className="text-lg">₹{cart.grandTotal.toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              disabled={cart.items.length === 0}
              className="w-full btn-amazon-yellow py-3.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Proceed to Buy ({cart.items.length} items)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
