'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { setCart } from '../../store/cartSlice';
import {
  User,
  Package,
  Heart,
  MapPin,
  Sparkles,
  RotateCcw,
  XCircle,
  FileText,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';

function ProfileDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Tab State
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Address Modal State
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Sync tab with params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  // 1. Fetch Orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/list').then((res) => res.data.orders),
    enabled: isAuthenticated && activeTab === 'orders',
  });

  // 2. Fetch Addresses
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => api.get('/orders/addresses').then((res) => res.data.addresses),
    enabled: isAuthenticated && activeTab === 'addresses',
  });

  // 3. Fetch Wishlist
  const { data: wishlist } = useQuery({
    queryKey: ['my-wishlist'],
    queryFn: () => api.get('/cart/wishlist').then((res) => res.data.wishlist),
    enabled: isAuthenticated && activeTab === 'wishlist',
  });

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: () =>
      api.post('/orders/addresses', { name, phone, streetAddress, city, state, postalCode, isDefault: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setShowAddrForm(false);
      setName('');
      setPhone('');
      setStreetAddress('');
      setCity('');
      setState('');
      setPostalCode('');
      alert('Address added successfully!');
    },
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    },
  });

  // Cancel Order Mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => api.post(`/orders/cancel/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      alert('Order cancelled successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    },
  });

  // Return Order Mutation
  const returnOrderMutation = useMutation({
    mutationFn: (id: string) => api.post(`/orders/return/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      alert('Return request approved & refunded!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit return request.');
    },
  });

  // Wishlist Add to Cart Helper
  const moveToCart = async (productId: string) => {
    try {
      const res = await api.post('/cart/add', { productId, quantity: 1 });
      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
        alert('Item added to cart!');
      }
    } catch (err) {
      alert('Failed to add item to cart.');
    }
  };

  // Wishlist delete helper
  const removeWishlist = async (productId: string) => {
    try {
      await api.post('/cart/wishlist/toggle', { productId });
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
    } catch (err) {
      alert('Failed to modify wishlist.');
    }
  };

  // Invoice download trigger using dynamic backend API URL
  const handleDownloadInvoice = (orderId: string) => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/orders/invoice/${orderId}?token=${token}`);
  };

  if (!mounted || !isAuthenticated || !user) {
    return <div className="p-12 text-center text-xs">Access Denied. Please sign in first.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header Banner */}
      <section className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-md relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <img
            src={user.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
            alt={user.name}
            className="h-16 w-16 rounded-full border-2 border-indigo-500 object-cover"
          />
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>{user.name}</span>
              <span className="bg-indigo-550 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider">
                {user.role}
              </span>
            </h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Loyalty Wallet stats */}
        <div className="flex gap-6 relative z-10 text-center text-xs border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="space-y-1">
            <span className="text-slate-450 block font-bold">Loyalty Wallet</span>
            <span className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1">
              <Sparkles className="h-4.5 w-4.5" />
              <span>{user.loyaltyPoints} Points</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-450 block font-bold">Referral ID</span>
            <span className="text-sm font-extrabold text-slate-200 uppercase font-mono tracking-wide">{user.referralCode}</span>
          </div>
        </div>
      </section>

      {/* 2. Main Tabbed Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl h-fit flex flex-col gap-1.5 shadow-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Orders History</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'addresses'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'wishlist'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Wishlist</span>
          </button>
        </aside>

        {/* Tab Details Area */}
        <main className="lg:col-span-3">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">My Orders</h2>
              {ordersLoading ? (
                <div className="py-12 text-center text-xs animate-pulse">Compiling orders history...</div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order: any) => (
                    <div
                      key={order._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
                    >
                      {/* Top Metadata */}
                      <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">
                            Reference: <span className="font-mono text-indigo-600 dark:text-indigo-400 uppercase">{order._id.substring(18)}</span>
                          </p>
                          <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Ordered on: {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            order.orderStatus === 'delivered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                              : order.orderStatus === 'cancelled'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                              : 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-400'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Products Grid */}
                      <div className="divide-y divide-slate-50 dark:divide-slate-850">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between py-3 text-xs gap-3">
                            <div className="truncate">
                              <p className="font-bold truncate text-slate-700 dark:text-slate-250">{item.product?.name || 'ShopCraft Item'}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quantity: {item.quantity}</p>
                            </div>
                            <span className="font-extrabold shrink-0">INR {(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Visual Order Progress Tracker Timeline */}
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' ? (
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Delivery Status</p>
                          <div className="flex items-center justify-between text-[11px] relative font-bold">
                            {/* Track bar line */}
                            <div className="absolute left-4 right-4 top-3 h-1 bg-slate-200 dark:bg-slate-800 -z-0">
                              <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{
                                  width:
                                    order.orderStatus === 'delivered'
                                      ? '100%'
                                      : order.orderStatus === 'shipped'
                                      ? '66%'
                                      : order.orderStatus === 'processed'
                                      ? '33%'
                                      : '10%',
                                }}
                              ></div>
                            </div>

                            {[
                              { label: 'Placed', active: true },
                              { label: 'Processing', active: order.orderStatus === 'processed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' },
                              { label: 'Shipped', active: order.orderStatus === 'shipped' || order.orderStatus === 'delivered' },
                              { label: 'Delivered', active: order.orderStatus === 'delivered' },
                            ].map((step, sIdx) => (
                              <div key={sIdx} className="flex flex-col items-center gap-1 z-10">
                                <div
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    step.active
                                      ? 'bg-green-500 text-white shadow-xs'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {step.active ? '✓' : sIdx + 1}
                                </div>
                                <span className={step.active ? 'text-slate-800 dark:text-slate-100 font-extrabold' : 'text-slate-400 font-medium'}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3.5 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          <span>This order was {order.orderStatus} and refunded to your original payment method.</span>
                        </div>
                      )}

                      {/* Total and actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 gap-4">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          Grand Total: <span className="text-indigo-650 dark:text-indigo-400">INR {order.grandTotal.toFixed(0)}</span>
                        </span>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleDownloadInvoice(order._id)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-xl text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px] font-bold transition"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download Invoice</span>
                          </button>

                          {(order.orderStatus === 'pending' || order.orderStatus === 'processed') && (
                            <button
                              onClick={() => cancelOrderMutation.mutate(order._id)}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 p-2 rounded-xl text-red-655 flex items-center gap-1 text-[11px] font-bold transition"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {order.orderStatus === 'delivered' && (
                            <button
                              onClick={() => returnOrderMutation.mutate(order._id)}
                              className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 p-2 rounded-xl text-orange-650 flex items-center gap-1 text-[11px] font-bold transition"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>Return &amp; Refund</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-12 text-center">You have not placed any orders yet.</p>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddrForm(!showAddrForm)}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Add Address Form */}
              {showAddrForm && (
                <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="text-xs font-black uppercase text-slate-400">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <input
                      type="text"
                      placeholder="Recipient Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Street Address, House No"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Postal Pin Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={() => addAddressMutation.mutate()}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition"
                  >
                    Save Address
                  </button>
                </div>
              )}

              {/* Addresses List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses && addresses.length > 0 ? (
                  addresses.map((a: any) => {
                    return (
                      <div
                        key={a._id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xs text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{a.name}</span>
                            {a.isDefault && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-slate-500 leading-relaxed font-semibold">{a.streetAddress}</p>
                          <p className="text-slate-400 font-bold">{a.city}, {a.state} - {a.postalCode}</p>
                        </div>

                        <button
                          onClick={() => deleteAddressMutation.mutate(a._id)}
                          className="text-red-500 hover:text-red-655 font-bold flex items-center gap-1 text-[11px] self-end mt-2 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Address</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 col-span-full">No saved addresses found.</p>
                )}
              </div>
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">My Wishlist</h2>
              {wishlist && wishlist.products?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlist.products.map((prod: any) => (
                    <div
                      key={prod._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-40 object-cover" />
                      
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase font-extrabold text-slate-400">{prod.brand}</p>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{prod.name}</h4>
                          <p className="text-xs font-black text-indigo-650 dark:text-indigo-400 mt-1">INR {prod.price}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => moveToCart(prod._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-center"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeWishlist(prod._id)}
                            className="border border-slate-200 dark:border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-500 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-12 text-center">Your wishlist is currently empty.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs animate-pulse">Loading profile dashboard...</div>}>
      <ProfileDetails />
    </Suspense>
  );
}
