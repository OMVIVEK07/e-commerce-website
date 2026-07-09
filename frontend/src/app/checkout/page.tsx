'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearCart } from '../../store/cartSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import { ShieldCheck, Truck, CreditCard, Landmark, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cart = useSelector((state: RootState) => state.cart);

  // Address and payment states
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedBilling, setSelectedBilling] = useState('');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'razorpay'>('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Address creation form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressName, setAddressName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPostal, setAddressPostal] = useState('');

  // 1. Fetch Saved Addresses
  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/orders/addresses').then((res) => res.data.addresses),
    enabled: isAuthenticated,
  });

  // Default address selections
  useEffect(() => {
    if (addressData && addressData.length > 0) {
      const defaultAddr = addressData.find((a: any) => a.isDefault) || addressData[0];
      setSelectedShipping(defaultAddr._id);
      setSelectedBilling(defaultAddr._id);
    }
  }, [addressData]);

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: () =>
      api.post('/orders/addresses', {
        name: addressName,
        phone: addressPhone,
        streetAddress: addressStreet,
        city: addressCity,
        state: addressState,
        postalCode: addressPostal,
        isDefault: addressData?.length === 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddressForm(false);
      setAddressName('');
      setAddressPhone('');
      setAddressStreet('');
      setAddressCity('');
      setAddressState('');
      setAddressPostal('');
      alert('Address added successfully!');
    },
  });

  const handlePlaceOrder = async () => {
    if (!selectedShipping) {
      alert('Please select a shipping address.');
      return;
    }

    const billingId = billingSameAsShipping ? selectedShipping : selectedBilling;
    if (!billingId) {
      alert('Please select a billing address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Initialize checkout payment intent (Stripe or Razorpay Order)
      const payInitRes = await api.post('/orders/checkout/initiate', {
        provider: paymentProvider,
        items: cart.items,
        couponCode: cart.couponCode || undefined,
      });

      const { paymentData } = payInitRes.data;
      const transactionId = paymentData.id;

      // 2. Perform mock payment processing
      // In production, you would load Stripe elements or Razorpay SDK here.
      // Since this is a test sandbox, we simulate a loading window and proceed.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Confirm order placement
      const placeRes = await api.post('/orders/place', {
        items: cart.items,
        shippingAddressId: selectedShipping,
        billingAddressId: billingId,
        paymentMethod: paymentProvider,
        paymentStatus: 'paid', // Mark as paid for sandbox verification
        transactionId: transactionId,
        couponApplied: cart.couponCode || undefined,
      });

      if (placeRes.data.success) {
        // Trigger rewards confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        dispatch(clearCart());
        router.push(`/checkout/success?orderId=${placeRes.data.order._id}`);
      }
    } catch (err: any) {
      console.error('[Order Placement Error]:', err);
      setError(err.response?.data?.message || 'Payment confirmation failed. Rerouting to failure checkout.');
      router.push('/checkout/failure');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return <div className="p-8 text-center text-xs">Redirecting to authorization gateway...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-8">
        <ShieldCheck className="h-6 w-6 text-indigo-500" />
        <span>Checkout Details</span>
      </h1>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 text-xs font-semibold rounded-2xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: ADDRESSES & PAYMENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-500" />
                <span>Shipping Address</span>
              </h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Address Inline Form */}
            {showAddressForm && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400">New Saved Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Recipient Full Name"
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Street Address, House No"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Postal Pin Code"
                    value={addressPostal}
                    onChange={(e) => setAddressPostal(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <button
                  onClick={() => addAddressMutation.mutate()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs"
                >
                  Save Address
                </button>
              </div>
            )}

            {/* Address Selection List */}
            {addressData && addressData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addressData.map((a: any) => (
                  <label
                    key={a._id}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between text-xs transition ${
                      selectedShipping === a._id
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      value={a._id}
                      checked={selectedShipping === a._id}
                      onChange={() => setSelectedShipping(a._id)}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{a.name}</span>
                        {a.isDefault && (
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 font-medium leading-relaxed">{a.streetAddress}</p>
                      <p className="text-slate-400 font-semibold">{a.city}, {a.state} - {a.postalCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No saved addresses found. Please add one above.</p>
            )}
          </div>

          {/* Billing Address Toggle */}
          {!billingSameAsShipping && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
              <h2 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Billing Address</h2>
              {addressData && addressData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addressData.map((a: any) => (
                    <label
                      key={a._id}
                      className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between text-xs transition ${
                        selectedBilling === a._id
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        value={a._id}
                        checked={selectedBilling === a._id}
                        onChange={() => setSelectedBilling(a._id)}
                        className="sr-only"
                      />
                      <div>
                        <p className="font-bold">{a.name}</p>
                        <p className="text-slate-500">{a.streetAddress}</p>
                        <p className="text-slate-400">{a.city}, {a.state} - {a.postalCode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={() => setBillingSameAsShipping(!billingSameAsShipping)}
              className="rounded-md border-slate-300 dark:border-slate-850 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Billing address is same as shipping address</span>
          </label>

          {/* Payment Gateways Selections */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
            <h2 className="text-sm font-bold border-b border-slate-150 dark:border-slate-800 pb-3">Secure Payment Portal</h2>

            <div className="grid grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition ${
                  paymentProvider === 'stripe'
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="stripe"
                  checked={paymentProvider === 'stripe'}
                  onChange={() => setPaymentProvider('stripe')}
                  className="sr-only"
                />
                <CreditCard className="h-6 w-6 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider">Stripe (Cards)</span>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition ${
                  paymentProvider === 'razorpay'
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="razorpay"
                  checked={paymentProvider === 'razorpay'}
                  onChange={() => setPaymentProvider('razorpay')}
                  className="sr-only"
                />
                <Landmark className="h-6 w-6 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider">Razorpay (UPI / Banks)</span>
              </label>
            </div>

            {/* Sandbox Notice */}
            <div className="flex gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] font-semibold leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <p>
                Gateways are running in Sandbox Sandbox/Mock mode. Card details can be mock formatted, and payments confirm immediately on submit.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-fit space-y-6 shadow-xs">
          <h2 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Order Summary</h2>

          {/* Items Checklist */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
            {cart.items.map((item: any) => {
              const discountedPrice = item.product.price * (1 - item.product.discount / 100);
              return (
                <div key={item._id} className="flex justify-between py-3 text-xs gap-3">
                  <div className="truncate">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold shrink-0">INR {(discountedPrice * item.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-450">Subtotal</span>
              <span className="font-semibold">INR {cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                <span>Coupon Deduct</span>
                <span>- INR {cart.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-450">GST tax (18%)</span>
              <span className="font-semibold">INR {cart.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-450">Shipping Fees</span>
              <span className="font-semibold">
                {cart.shippingCharges === 0 ? <span className="text-green-600 font-bold">FREE</span> : `INR ${cart.shippingCharges.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black border-t-2 pt-3">
              <span>Grand Total</span>
              <span className="text-indigo-650 dark:text-indigo-400">INR {cart.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || cart.items.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Authorizing Transaction...</span>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Confirm Purchase (INR {cart.grandTotal.toFixed(0)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
