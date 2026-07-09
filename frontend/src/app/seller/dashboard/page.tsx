'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Upload,
  Trash2
} from 'lucide-react';

export default function SellerDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Product upload form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState(10);
  const [category, setCategory] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [warranty, setWarranty] = useState('1 year brand warranty');
  const [features, setFeatures] = useState('Premium Quality, Express Delivery');
  
  // Custom specifications helper
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // 1. Fetch Seller Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: () => api.get('/seller/analytics').then((res) => res.data.analytics),
  });

  // 2. Fetch Seller Products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => api.get('/seller/products').then((res) => res.data.products),
  });

  // 3. Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((res) => res.data.categories),
  });

  // 4. Fetch Seller Orders
  const { data: orders } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => api.get('/seller/orders').then((res) => res.data.orders),
  });

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: (body: any) => api.post('/seller/products', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      alert('Product uploaded successfully!');
      setName('');
      setBrand('');
      setDescription('');
      setPrice(0);
      setDiscount(0);
      setStock(10);
      setCategory('');
      setImageInput('');
      setSpecs({});
      setActiveTab('catalog');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to upload product. Make sure seller profile is verified by admin.');
    },
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/seller/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
    },
  });

  // Update Order Status Mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ oId, status }: { oId: string; status: string }) =>
      api.put(`/seller/orders/${oId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      alert('Order shipping status updated!');
    },
  });

  const handleAddSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setSpecs((prev) => ({ ...prev, [specKey.trim()]: specVal.trim() }));
      setSpecKey('');
      setSpecVal('');
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand || !category || !imageInput) {
      alert('Please fill out Name, Brand, Category, and provide at least one image URL.');
      return;
    }

    const payload = {
      name,
      brand,
      description,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      category,
      images: [imageInput],
      warranty,
      features: features.split(',').map((x) => x.trim()),
      specifications: specs,
    };

    addProductMutation.mutate(payload);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl h-fit flex flex-col gap-1 shadow-xs">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-850 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seller Dashboard</span>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'upload'
                ? 'bg-teal-600 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Upload Product</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'catalog'
                ? 'bg-teal-600 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Manage Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white'
                : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Merchant Orders</span>
          </button>
        </aside>

        {/* DETAILS PANEL */}
        <main className="flex-grow">
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && analyticsData && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Performance Overview</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-slate-450 block font-bold uppercase">Store Earnings</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>INR {analyticsData.revenue.toFixed(0)}</span>
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-slate-450 block font-bold uppercase">Orders Processed</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{analyticsData.ordersCount}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-slate-450 block font-bold uppercase">Listed Items</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{analyticsData.totalProducts}</span>
                </div>
              </div>

              {/* Low Stock alerts */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-red-500">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>Low Stock Warning (Under 5 items)</span>
                </h3>
                {analyticsData.stockAlerts?.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {analyticsData.stockAlerts.map((prod: any) => (
                      <div key={prod._id} className="flex justify-between py-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-250">{prod.name}</span>
                        <span className="text-red-500 font-extrabold">{prod.stock} items remaining</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">All listed inventory levels are healthy.</p>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD PRODUCT FORM */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Upload New Product</h2>
              <form onSubmit={handleProductSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 text-xs font-semibold">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. UltraFit Tracker Band"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Brand *</label>
                    <input
                      type="text"
                      placeholder="e.g. FitBit"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-450 uppercase">Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Base Price (INR) *</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Discount Percent (%)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Initial Stock *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories?.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-450 uppercase flex items-center gap-1">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Product Image URL *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Paste image address (Unsplash, Cloudinary, etc.)"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2"
                      required
                    />
                  </div>
                </div>

                {/* Technical Specifications Map Builder */}
                <div className="bg-slate-55 dark:bg-slate-955 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400">Technical Specifications</h4>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      placeholder="Spec Label (e.g. RAM)"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 16GB)"
                      value={specVal}
                      onChange={(e) => setSpecVal(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg"
                    >
                      Add Spec
                    </button>
                  </div>
                  {Object.keys(specs).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-2">
                      {Object.entries(specs).map(([k, v]) => (
                        <div key={k} className="bg-white dark:bg-slate-900 px-3 py-1 rounded-sm border">
                          {k}: {v}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addProductMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition"
                >
                  Upload Product to Store
                </button>
              </form>
            </div>
          )}

          {/* CATALOG LISTINGS */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">My Catalog</h2>
              {productsLoading ? (
                <p className="text-xs text-slate-400 animate-pulse text-center">Loading catalog...</p>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((prod: any) => (
                    <div
                      key={prod._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between text-xs"
                    >
                      <img src={prod.images[0]} alt={prod.name} className="h-40 w-full object-cover" />
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold truncate text-slate-700 dark:text-slate-250">{prod.name}</h4>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-extrabold uppercase">{prod.brand}</span>
                          <span className="font-extrabold text-teal-650 dark:text-teal-400">Stock: {prod.stock}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-black text-slate-805 dark:text-slate-100">INR {prod.price}</span>
                          <button
                            onClick={() => deleteProductMutation.mutate(prod._id)}
                            className="text-red-500 hover:text-red-655"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-455 text-center py-12">You have not uploaded any products yet.</p>
              )}
            </div>
          )}

          {/* MERCHANT ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">Merchant Orders</h2>
              {orders && orders.length > 0 ? (
                <div className="space-y-6 text-xs">
                  {orders.map((o: any) => (
                    <div
                      key={o._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4"
                    >
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                        <div>
                          <p className="font-extrabold">Order Ref: <span className="font-mono text-indigo-600 uppercase">{o._id.substring(18)}</span></p>
                          <p className="text-[10px] text-slate-400">Date: {new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Shipping Status:</span>
                          <select
                            value={o.orderStatus}
                            onChange={(e) => updateOrderMutation.mutate({ oId: o._id, status: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-950 border rounded-lg px-2 py-1 font-bold text-[10px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {o.items.map((i: any, idx: number) => (
                          <div key={idx} className="flex justify-between font-semibold">
                            <span className="text-slate-655 dark:text-slate-350 truncate max-w-[250px]">{i.product?.name}</span>
                            <span>Qty: {i.quantity} &bull; INR {i.price * i.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-455 text-center py-12">No customer orders found containing your listed products.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
