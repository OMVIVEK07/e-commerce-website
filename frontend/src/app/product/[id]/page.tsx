'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../../store/cartSlice';
import { RootState } from '../../../store';
import {
  Star,
  Heart,
  CheckCircle,
  Truck,
  RotateCcw,
  ThumbsUp,
  Image as ImageIcon,
  Shield,
  CreditCard,
  Tag,
  ChevronRight
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = dispatchFunc();
  function dispatchFunc() {
    try {
      return useDispatch();
    } catch (e) {
      return (action: any) => {};
    }
  }
  const queryClient = useQueryClient();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const productId = params.id as string;

  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: '0% 0%', transform: 'scale(1)' });

  // Reviews submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState('');

  // Pincode checker state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput.trim()) return;
    setPincodeLoading(true);
    try {
      const res = await api.get(`/products/pincode/check?pincode=${pincodeInput}`);
      if (res.data.success) {
        setPincodeResult(res.data);
      }
    } catch (err) {
      // ignore
    } finally {
      setPincodeLoading(false);
    }
  };

  // 1. Fetch Product Detail
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get(`/products/item/${productId}`).then((res) => res.data),
  });

  const product = data?.product;
  const reviews = data?.reviews || [];

  // Setup default active image
  useEffect(() => {
    if (product && product.images?.length > 0) {
      setActiveImage(product.images[0]);
      if (product.variants?.length > 0) {
        setSelectedVariant(product.variants[0]);
      }
    }
  }, [product]);

  // Track in recently viewed
  useEffect(() => {
    if (product) {
      const items = localStorage.getItem('recentlyViewed');
      let list = items ? JSON.parse(items) : [];
      list = list.filter((x: any) => x._id !== product._id);
      list.unshift({
        _id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.images[0],
      });
      localStorage.setItem('recentlyViewed', JSON.stringify(list.slice(0, 8)));
    }
  }, [product]);

  // Image Zoom Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: '0% 0%',
      transform: 'scale(1)',
    });
  };

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: () =>
      api.post('/cart/add', {
        productId,
        quantity,
        variant: selectedVariant
          ? {
              color: selectedVariant.color,
              size: selectedVariant.size,
              weight: selectedVariant.weight,
            }
          : undefined,
      }),
    onSuccess: (res) => {
      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
        alert('Product added to cart!');
      }
    },
    onError: () => {
      alert('Failed to add product to cart. Make sure you are signed in.');
    },
  });

  // Direct checkout placing
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      alert('Please sign in first');
      router.push('/login');
      return;
    }
    try {
      await api.post('/cart/add', {
        productId,
        quantity: 1,
        variant: selectedVariant
          ? {
              color: selectedVariant.color,
              size: selectedVariant.size,
              weight: selectedVariant.weight,
            }
          : undefined,
      });
      router.push('/cart');
    } catch (err) {
      alert('Failed to process Direct checkout.');
    }
  };

  // Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: () =>
      api.post(`/products/item/${productId}/review`, {
        rating: reviewRating,
        comment: reviewComment,
        photos: reviewPhoto ? [reviewPhoto] : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setReviewComment('');
      setReviewPhoto('');
      alert('Review submitted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit review.');
    },
  });

  // Helpful click mutation
  const markHelpfulMutation = useMutation({
    mutationFn: (reviewId: string) => api.post(`/products/review/${reviewId}/helpful`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse text-center text-sm">Loading product details...</div>;
  }

  if (error || !product) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">Failed to load product. Item may not exist.</div>;
  }

  const basePrice = product.price + (selectedVariant?.additionalPrice || 0);
  const finalPrice = basePrice * (1 - product.discount / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 font-sans text-slate-800">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-450 uppercase tracking-wide">
        <Link href="/" className="hover:underline">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:underline">Catalog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600">{product.brand}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-2xs">
        <div className="lg:col-span-6 flex flex-col md:flex-row gap-4 items-start">
          <div className="flex flex-row md:flex-col gap-2 order-2 md:order-1 w-full md:w-16 overflow-x-auto md:overflow-y-auto scrollbar-none max-h-[380px]">
            {product.images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImage(img)}
                className={`h-14 w-14 shrink-0 rounded-md border-2 overflow-hidden flex items-center justify-center p-1 bg-white dark:bg-slate-850 ${
                  activeImage === img ? 'border-orange-500 shadow-xs' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <img src={img || undefined} alt="Product Thumbnail" className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>

          <div className="flex-1 order-1 md:order-2 w-full">
            <div
              className="w-full h-[380px] md:h-[420px] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden relative cursor-zoom-in bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={activeImage || undefined}
                alt={product.name}
                style={zoomStyle}
                className="max-h-full max-w-full object-contain transition-transform duration-75"
              />
              {product.discount > 0 && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide shadow-xs">
                  {product.discount}% Off
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-bold">Roll over image to zoom in</p>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-[#2874F0] tracking-wide hover:underline cursor-pointer">
                Brand: {product.brand}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-snug mt-1">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4.5 w-4.5 ${i < Math.round(product.rating) ? 'fill-amber-500' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="font-extrabold text-slate-700 dark:text-slate-350 ml-1">
                  {product.rating} ({product.reviewsCount} global ratings)
                </span>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-800"></div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                {product.discount > 0 && (
                  <span className="text-2xl font-light text-red-600">-{product.discount}%</span>
                )}
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  ₹{finalPrice.toFixed(0)}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                {product.discount > 0 && (
                  <span>M.R.P.: <span className="line-through">₹{basePrice.toFixed(0)}</span></span>
                )}
                <span>Inclusive of all taxes</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-orange-500" />
                <span>Special Offers & Coupons</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-md flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-850 dark:text-white">Bank Offer</p>
                    <p className="mt-0.5">Flat 10% instant discount on Axis Bank and ICICI Cards.</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-md flex items-start gap-2">
                  <Shield className="h-4 w-4 text-[#ff9900] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-850 dark:text-white">GST Invoice Benefits</p>
                    <p className="mt-0.5">Claim up to 28% back in business tax credits.</p>
                  </div>
                </div>
              </div>
            </div>

            {product.variants?.length > 0 && (
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Available Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.images?.[0]) setActiveImage(v.images[0]);
                      }}
                      className={`px-3 py-2 rounded-md border text-xs font-bold transition ${
                        selectedVariant?.sku === v.sku
                          ? 'border-[#ff9900] bg-orange-50 dark:bg-orange-950/20 text-[#e48800]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {v.color} {v.size ? `/ ${v.size}` : ''} {v.weight ? `/ ${v.weight}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs">
              {product.stock > 0 ? (
                <p className="font-bold flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${product.stock <= 5 ? 'bg-red-500 animate-ping' : 'bg-green-600'}`}></span>
                  <span className={product.stock <= 5 ? 'text-red-600 font-extrabold' : 'text-green-600'}>
                    {product.stock <= 5 ? `Only ${product.stock} items remaining in stock - order soon!` : 'In Stock & Ready to Ship'}
                  </span>
                </p>
              ) : (
                <p className="font-bold text-red-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-650"></span>
                  <span>Currently Out of Stock</span>
                </p>
              )}
            </div>

            {/* Pincode Serviceability Check Widget */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Truck className="h-4 w-4 text-orange-500" />
                <span>Delivery & Pincode Serviceability</span>
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode (e.g. 110001)"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs font-bold outline-hidden"
                />
                <button
                  type="submit"
                  disabled={pincodeLoading}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-md text-xs transition"
                >
                  {pincodeLoading ? 'Checking...' : 'Check'}
                </button>
              </form>

              {pincodeResult && (
                <div className="text-[11px] pt-1">
                  {pincodeResult.isServiceable ? (
                    <div className="space-y-0.5 text-green-600 font-bold">
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Delivery available to {pincodeResult.city}, {pincodeResult.state}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">
                        Estimated Delivery by <span className="font-bold text-slate-900 dark:text-white">{pincodeResult.deliveryDate}</span> ({pincodeResult.isExpressAvailable ? 'Express Shipping' : 'Standard Delivery'})
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-500 font-bold">Sorry, delivery is currently unavailable for pincode {pincodeResult.pincode}.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-black text-slate-450 uppercase tracking-wide">Select Qty:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                {[...Array(Math.min(10, product.stock || 1))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addToCartMutation.mutate()}
                disabled={product.stock <= 0 || addToCartMutation.isPending}
                className="flex-1 bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] font-bold py-3.5 px-6 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-[#ffa41c] hover:bg-[#fa8900] text-[#111] font-bold py-3.5 px-6 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Buy Now</span>
              </button>

              <button
                onClick={async () => {
                  if (!isAuthenticated) return alert('Please sign in first');
                  await api.post('/cart/wishlist/toggle', { productId });
                  alert('Wishlist status updated!');
                }}
                className="p-3.5 border border-slate-250 dark:border-slate-800 hover:border-red-500 rounded-md text-slate-400 hover:text-red-500 transition shrink-0 flex items-center justify-center"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 text-center font-semibold leading-relaxed">
              <div className="space-y-1">
                <Truck className="h-4.5 w-4.5 text-slate-500 mx-auto" />
                <p>Express Delivery ({product.deliveryTime || '3-4 Days'})</p>
              </div>
              <div className="space-y-1">
                <RotateCcw className="h-4.5 w-4.5 text-slate-500 mx-auto" />
                <p>Easy Replacement ({product.returnPolicy || '7-day replacement'})</p>
              </div>
              <div className="space-y-1">
                <CheckCircle className="h-4.5 w-4.5 text-slate-500 mx-auto" />
                <p>Warranty Covered ({product.warranty || '1 Year'})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4 shadow-2xs">
          <h2 className="text-base font-black border-b border-slate-100 dark:border-slate-800 pb-2.5">Product Overview</h2>
          <p className="text-sm text-slate-655 dark:text-slate-350 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {product.features?.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Key Features</h3>
              <ul className="list-disc pl-5 text-sm text-slate-500 space-y-1">
                {product.features.map((feat: string, i: number) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-2xs">
          <h2 className="text-base font-black border-b border-slate-100 dark:border-slate-800 pb-2.5">Product Specifications</h2>
          {product.specifications && Object.keys(product.specifications).length > 0 ? (
            <div className="divide-y divide-slate-150 dark:divide-slate-800 text-xs mt-2">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex py-2.5 gap-3">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider w-1/3 shrink-0">{key}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold flex-1">{val as string}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No technical specifications provided for this product.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-6 shadow-2xs">
        <h2 className="text-base font-black border-b border-slate-100 dark:border-slate-800 pb-2.5">Customer Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4 bg-slate-55/30 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-100 dark:border-slate-850">
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Write a Review</h3>
            {isAuthenticated ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitReviewMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500">Stars Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-2 text-xs"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Review Message</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you liked or disliked about this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-md p-3 text-xs outline-hidden focus:ring-1 focus:ring-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Photo Attachment URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cloudinary image address"
                    value={reviewPhoto}
                    onChange={(e) => setReviewPhoto(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-md px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="w-full bg-[#f0c14b] border border-[#a88734] hover:bg-[#eebb3a] text-[#111] font-bold py-2 rounded-md text-xs transition"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-400">Please login to write review feedback.</p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Customer Feedback</h3>
            {reviews.length > 0 ? (
              <div className="divide-y divide-slate-150 dark:divide-slate-800 space-y-4">
                {reviews.map((rev: any) => (
                  <div key={rev._id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.user?.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                          alt={rev.user?.name}
                          className="h-6 w-6 rounded-full"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                          {rev.user?.name}
                        </span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-500' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {rev.comment}
                    </p>

                    {rev.photos?.length > 0 && (
                      <div className="flex gap-2">
                        {rev.photos.map((pUrl: string, idx: number) => (
                          <img
                            key={idx}
                            src={pUrl}
                            alt="Attachment"
                            className="h-16 w-20 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span>Reviewed on: {new Date(rev.createdAt).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <button
                        onClick={() => markHelpfulMutation.mutate(rev._id)}
                        className="hover:text-orange-600 flex items-center gap-1"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Helpful ({rev.helpfulUsers?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No customer reviews yet. Be the first to share your feedback!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
