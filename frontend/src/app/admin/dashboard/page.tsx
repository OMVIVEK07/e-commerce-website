'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import {
  Sparkles,
  Shield,
  Users,
  CheckSquare,
  Ticket,
  Database,
  LineChart,
  UserX,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Coupon Form States
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [minPurchase, setMinPurchase] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');

  // 1. Fetch Admin Statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((res) => res.data.stats),
  });

  // 2. Fetch Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((res) => res.data.users),
    enabled: activeTab === 'users',
  });

  // 3. Fetch Sellers
  const { data: sellersData, isLoading: sellersLoading } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => api.get('/admin/sellers').then((res) => res.data.sellers),
    enabled: activeTab === 'sellers',
  });

  // 4. Fetch Coupons
  const { data: couponsData } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then((res) => res.data.coupons),
    enabled: activeTab === 'coupons',
  });

  // Toggle User Block Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: (uId: string) => api.post(`/admin/users/${uId}/toggle-block`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert(res.data.message || 'User status updated!');
    },
  });

  // Verify Seller Mutation
  const verifySellerMutation = useMutation({
    mutationFn: ({ sId, isVerified }: { sId: string; isVerified: boolean }) =>
      api.put(`/admin/sellers/${sId}/verify`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      alert('Merchant verification status updated!');
    },
  });

  // Create Coupon Mutation
  const createCouponMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/coupons', {
        code: couponCode,
        discountType,
        discountAmount,
        minPurchase,
        expiryDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCouponCode('');
      setDiscountAmount(0);
      setMinPurchase(0);
      setExpiryDate('');
      alert('Coupon created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create coupon.');
    },
  });

  // Delete Coupon Mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  // Seed Database Mutation
  const seedDatabaseMutation = useMutation({
    mutationFn: () => api.post('/admin/seed'),
    onSuccess: (res) => {
      alert(res.data.message || 'Store database seeded successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => {
      alert('Database seeding failed.');
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl h-fit flex flex-col gap-1 shadow-xs">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-855 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Control</span>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'overview'
                ? 'bg-violet-650 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <LineChart className="h-4 w-4" />
            <span>Overview Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'users'
                ? 'bg-violet-650 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Moderate Users</span>
          </button>

          <button
            onClick={() => setActiveTab('sellers')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'sellers'
                ? 'bg-violet-650 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Verify Sellers</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'coupons'
                ? 'bg-violet-650 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>Manage Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('seed')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'seed'
                ? 'bg-violet-650 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Seed Database</span>
          </button>
        </aside>

        {/* DETAILS PANEL */}
        <main className="flex-grow">
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Platform Analytics</h2>
              
              {statsLoading ? (
                <p className="text-xs text-slate-400 animate-pulse text-center">Assembling global statistics...</p>
              ) : statsData && (
                <div className="space-y-8 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-xs space-y-1">
                      <span className="text-slate-450 block uppercase">Overall Sales Revenue</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">INR {statsData.totalRevenue.toFixed(0)}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-xs space-y-1">
                      <span className="text-slate-450 block uppercase">Total Users</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{statsData.totalUsers}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-xs space-y-1">
                      <span className="text-slate-450 block uppercase">Active Merchants</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{statsData.totalSellers}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-xs space-y-1">
                      <span className="text-slate-450 block uppercase">Orders Placed</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{statsData.totalOrders}</span>
                    </div>
                  </div>

                  {/* Visual Premium Charts using HTML5 CSS grids */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
                    <h3 className="text-sm font-bold">Daily Earnings Chart</h3>
                    <div className="flex items-end justify-between h-48 pt-6 border-b border-l border-slate-100 dark:border-slate-850 px-4">
                      {statsData.chartData?.length > 0 ? (
                        statsData.chartData.map((d: any, idx: number) => {
                          const percent = Math.min(100, Math.max(10, (d.totalSales / statsData.totalRevenue) * 300));
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 w-1/8 group">
                              <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition">INR {d.totalSales.toFixed(0)}</span>
                              <div
                                style={{ height: `${percent}px` }}
                                className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all duration-500"
                              />
                              <span className="text-[10px] text-slate-450 font-bold">{d.date.substring(5)}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 w-full text-center pb-20">No checkout transactions logs found for chart mapping.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USER MODERATION PANEL */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">User Moderation</h2>
              {usersLoading ? (
                <p className="text-xs text-slate-400 animate-pulse text-center">Retrieving user accounts...</p>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-extrabold uppercase text-[10px] text-slate-450">
                        <th className="p-4">User</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
                      {usersData?.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/55">
                          <td className="p-4 flex items-center gap-2">
                            <img src={u.profilePic} className="h-6 w-6 rounded-full" />
                            <span>{u.name}</span>
                          </td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4 uppercase text-[10px] font-black">{u.role}</td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleBlockMutation.mutate(u._id)}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                u.isBlocked
                                  ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                                  : 'bg-red-50 text-red-655 dark:bg-red-950/20'
                              }`}
                            >
                              {u.isBlocked ? 'Unblock' : 'Block User'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SELLER VERIFICATION PANEL */}
          {activeTab === 'sellers' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Seller Verification</h2>
              {sellersLoading ? (
                <p className="text-xs text-slate-400 animate-pulse text-center">Retrieving merchant listings...</p>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-extrabold uppercase text-[10px] text-slate-450">
                        <th className="p-4">Shop Name</th>
                        <th className="p-4">Merchant Phone</th>
                        <th className="p-4">GSTIN</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-855 font-semibold">
                      {sellersData?.map((s: any) => (
                        <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/55">
                          <td className="p-4 font-bold">{s.companyName}</td>
                          <td className="p-4">{s.phone}</td>
                          <td className="p-4 font-mono font-bold uppercase">{s.gstin || 'None'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] uppercase ${
                              s.isVerified
                                ? 'bg-green-100 text-green-800 dark:bg-green-950/20'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20'
                            }`}>
                              {s.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => verifySellerMutation.mutate({ sId: s._id, isVerified: !s.isVerified })}
                              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 px-3 py-1 rounded-lg font-bold"
                            >
                              {s.isVerified ? 'Revoke Approval' : 'Approve Seller'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COUPONS PANEL */}
          {activeTab === 'coupons' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-fit space-y-4 shadow-xs text-xs font-semibold">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Create Coupon</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createCouponMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Coupon Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. MEGA50"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 font-bold uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat Deduct (INR)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Discount Amount *</label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Min Order Purchase (INR)</label>
                    <input
                      type="number"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Expiry Date *</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createCouponMutation.isPending}
                    className="w-full bg-violet-650 hover:bg-violet-700 text-white font-bold py-2 rounded-xl"
                  >
                    Save Coupon Code
                  </button>
                </form>
              </div>

              {/* Coupons List */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs font-semibold">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Coupons</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-3">
                  {couponsData?.map((c: any) => (
                    <div key={c._id} className="pt-3 first:pt-0 flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-slate-800 dark:text-slate-150 uppercase font-mono">{c.code}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c.discountType === 'percentage' ? `${c.discountAmount}% Off` : `INR ${c.discountAmount} Flat`} &bull; Min spend: INR {c.minPurchase}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCouponMutation.mutate(c._id)}
                        className="text-red-500 hover:text-red-655 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEED DATABASE TAB */}
          {activeTab === 'seed' && (
            <div className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl space-y-6 shadow-xs text-xs font-semibold">
              <div className="text-center space-y-2">
                <Database className="h-10 w-10 text-indigo-500 mx-auto" />
                <h2 className="text-sm font-black">Sandbox Data Loader</h2>
                <p className="text-slate-400">
                  Seed the database catalog with sample items, reviews, active discount codes, and categories for immediate testing.
                </p>
              </div>

              <div className="flex gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900 rounded-xl leading-relaxed">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>
                  Warning: Seeding will overwrite existing mock category catalog indexes and clear previous items to prevent collisions.
                </span>
              </div>

              <button
                onClick={() => seedDatabaseMutation.mutate()}
                disabled={seedDatabaseMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-755 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50 text-center flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{seedDatabaseMutation.isPending ? 'Seeding Database...' : 'Run Catalog Database Seeding'}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
