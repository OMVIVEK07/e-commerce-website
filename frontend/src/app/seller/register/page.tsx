'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { updateUser } from '../../../store/authSlice';
import api from '../../../services/api';
import { Sparkles, ShoppingBag, Landmark, LandmarkIcon } from 'lucide-react';

export default function SellerRegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone || !address || !accountNumber || !ifscCode || !bankName) {
      alert('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/seller/register', {
        companyName,
        description,
        phone,
        address,
        gstin,
        bankDetails: {
          accountNumber,
          ifscCode,
          bankName,
        },
      });

      if (res.data.success) {
        dispatch(updateUser({ role: 'seller' }));
        alert('Seller profile created! Awaiting admin verification.');
        router.push('/seller/dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Seller registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return <div className="p-12 text-center text-xs">Please sign in to register as a seller.</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl w-fit mx-auto">
            <ShoppingBag className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black">Register as a ShopCraft Seller</h1>
          <p className="text-xs text-slate-400">Launch your merchant store, upload listings, and monitor revenue</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6 text-xs font-semibold">
          {/* Shop details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-teal-600 dark:text-teal-450 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Sparkles className="h-4 w-4" />
              <span>Shop Credentials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-slate-450 uppercase">Company / Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Tech Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-slate-450 uppercase">Merchant Description</label>
                <textarea
                  rows={2}
                  placeholder="Tell us what you sell..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase">Business Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-slate-450 uppercase">Business Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Banking details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-teal-600 dark:text-teal-450 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Landmark className="h-4 w-4" />
              <span>Billing &amp; Bank Account</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-slate-450 uppercase">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase">Account Number *</label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-450 uppercase">IFSC Code *</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
          >
            {loading ? 'Submitting Registration...' : 'Complete Merchant Signup'}
          </button>
        </form>
      </div>
    </div>
  );
}
