'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Sparkles,
  ArrowRight,
  Flame,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  CheckCircle
} from 'lucide-react';

const HERO_SLIDES = [
  {
    title: "Mobiles & Laptops Super Sale",
    subtitle: "Up to 40% Off on iPhones, MacBooks & Premium Electronics",
    buttonText: "Shop Tech Deals",
    link: "/products?category=electronics",
    bg: "from-slate-900 via-indigo-950 to-slate-900",
    badge: "Limited Time Offer"
  },
  {
    title: "Step Up Your Fashion Game",
    subtitle: "Up to 60% Off on Premium Sneakers, Athletic Wear & Jackets",
    buttonText: "Explore Fashion",
    link: "/products?category=fashion",
    bg: "from-purple-950 via-pink-950 to-purple-900",
    badge: "Trending Style Fest"
  },
  {
    title: "Upgrade Your Smart Home",
    subtitle: "Get Special Partner Discounts on Smart Appliances & Displays",
    buttonText: "Shop Home Deals",
    link: "/products?category=home-appliances",
    bg: "from-teal-950 via-slate-900 to-indigo-950",
    badge: "Best Seller Brands"
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const dealsScrollRef = useRef<HTMLDivElement>(null);
  const recsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-play slide timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((res) => res.data.categories),
  });

  // Fetch Flash Sale / Deals (increased limit to support scrolling)
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/products/list?limit=12').then((res) => res.data.products),
  });

  // Fetch AI Recommendations
  const { data: recs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => api.get('/products/recommendations').then((res) => res.data.recommendations),
  });

  // Load recently viewed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const items = localStorage.getItem('recentlyViewed');
      if (items) {
        try {
          setRecentlyViewed(JSON.parse(items).slice(0, 5));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. HERO SLIDER BANNER */}
      <section className="relative overflow-hidden h-[340px] md:h-[400px]">
        {/* Banner slides container */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`w-full h-full shrink-0 bg-linear-to-r ${slide.bg} text-white flex items-center px-8 md:px-16 relative`}
            >
              {/* Decorative backgrounds */}
              <div className="absolute inset-0 bg-radial from-transparent via-[#131921]/60 to-[#131921]/80"></div>
              
              <div className="max-w-5xl mx-auto w-full relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                <div className="space-y-4">
                  <span className="inline-block bg-[#ff9900]/20 border border-[#ff9900]/40 text-[#ffe11b] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm">
                    {slide.badge}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={slide.link}
                      className="bg-[#ffe11b] hover:bg-[#e6c912] text-slate-900 text-xs font-black uppercase tracking-wide px-6 py-3 rounded-md inline-flex items-center gap-1.5 shadow-md transition"
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Sub banner styling accents */}
                <div className="hidden md:flex justify-end pr-6">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-xl shadow-2xl backdrop-blur-xs flex flex-col justify-between w-64 h-56">
                    <div className="flex justify-between items-center text-[#ffe11b]">
                      <span className="text-[10px] font-black uppercase tracking-wide bg-white/10 px-2 py-0.5 rounded-sm">Featured</span>
                      <Sparkles className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Assured Shopping</p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">Shop with full purchase protection and double-gateway billing systems.</p>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Free Replacements</span>
                      <span>✓ Assured</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/40 text-white p-2 rounded-full z-20 focus:outline-hidden transition"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/40 text-white p-2 rounded-full z-20 focus:outline-hidden transition"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* 2. TRUST VALUE BANNERS STRIP */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center gap-3 shadow-2xs">
          <Truck className="h-8 w-8 text-[#ff9900] shrink-0" />
          <div>
            <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">Free & Fast Delivery</h4>
            <p className="text-[10px] text-slate-400 font-medium">On eligible orders over ₹999 across India.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center gap-3 shadow-2xs">
          <RotateCcw className="h-8 w-8 text-[#ff9900] shrink-0" />
          <div>
            <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">7 Days Easy Return</h4>
            <p className="text-[10px] text-slate-400 font-medium">Hassle-free replacement policy with no questions asked.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center gap-3 shadow-2xs">
          <ShieldCheck className="h-8 w-8 text-[#ff9900] shrink-0" />
          <div>
            <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">100% Secure Payments</h4>
            <p className="text-[10px] text-slate-400 font-medium">Multi-gateway payments protected by SSL validation.</p>
          </div>
        </div>
      </section>

      {/* 3. QUADRANT CATEGORY GRID BOXES */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Electronics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-2xs">
          <div>
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 mb-3">Up to 40% off | Mobiles & Laptops</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/products?category=electronics" className="group">
                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=60" alt="Mobiles" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Smartphones</p>
              </Link>
              <Link href="/products?category=electronics" className="group">
                <img src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&auto=format&fit=crop&q=60" alt="Laptops" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Laptops</p>
              </Link>
              <Link href="/products?category=electronics" className="group">
                <img src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&auto=format&fit=crop&q=60" alt="Audio" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Headphones</p>
              </Link>
              <Link href="/products?category=electronics" className="group">
                <img src="https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=150&auto=format&fit=crop&q=60" alt="Accessories" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Smart Watches</p>
              </Link>
            </div>
          </div>
          <Link href="/products?category=electronics" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-4 block">
            See all offers
          </Link>
        </div>

        {/* Box 2: Fashion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-2xs">
          <div>
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 mb-3">Up to 60% off | Fashion Styles</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/products?category=fashion" className="group">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=60" alt="Shoes" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Sneakers</p>
              </Link>
              <Link href="/products?category=fashion" className="group">
                <img src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&auto=format&fit=crop&q=60" alt="Jackets" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Jackets</p>
              </Link>
              <Link href="/products?category=fashion" className="group">
                <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=150&auto=format&fit=crop&q=60" alt="Tshirts" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">T-Shirts</p>
              </Link>
              <Link href="/products?category=fashion" className="group">
                <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150&auto=format&fit=crop&q=60" alt="Active" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Sportswear</p>
              </Link>
            </div>
          </div>
          <Link href="/products?category=fashion" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-4 block">
            See all offers
          </Link>
        </div>

        {/* Box 3: Smart Home */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-2xs">
          <div>
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 mb-3">Upgrade Your Home | Up to 50% Off</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/products?category=home-appliances" className="group">
                <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=60" alt="Kitchen" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Kitchen Appliances</p>
              </Link>
              <Link href="/products?category=home-appliances" className="group">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=60" alt="Kitchen Setup" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Home Decor</p>
              </Link>
              <Link href="/products?category=home-appliances" className="group">
                <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=60" alt="Personal" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Grooming Kits</p>
              </Link>
              <Link href="/products?category=home-appliances" className="group">
                <img src="https://images.unsplash.com/photo-1545241047-6083a3684587?w=150&auto=format&fit=crop&q=60" alt="Living" className="h-20 w-full object-cover rounded-md group-hover:opacity-90" />
                <p className="text-[10px] font-bold mt-1 text-slate-650 dark:text-slate-300">Air Purifiers</p>
              </Link>
            </div>
          </div>
          <Link href="/products?category=home-appliances" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-4 block">
            See all offers
          </Link>
        </div>

        {/* Box 4: Sellers */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg text-white flex flex-col justify-between shadow-2xs relative overflow-hidden">
          <div className="absolute top-1/2 right-0 w-32 h-32 bg-[#ff9900]/10 rounded-full blur-2xl"></div>
          <div>
            <span className="inline-block bg-[#ff9900]/20 border border-[#ff9900]/40 text-[#ffe11b] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
              Sellers Central
            </span>
            <h3 className="font-black text-lg mt-3 leading-snug">Sell on ShopCraft Marketplace</h3>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Reach millions of customers across India. Zero setup fee, low referral fee, and dedicated account support helper.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/seller/register"
              className="bg-[#ffe11b] hover:bg-[#e6c912] text-slate-900 text-[11px] font-black uppercase tracking-wider py-2.5 px-4 rounded-md inline-flex items-center gap-1.5 transition w-full justify-center"
            >
              <span>Register as Seller</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. TODAY'S DEALS & NEW ARRIVALS HORIZONTAL SCROLLBAR */}
      <section className="max-w-7xl mx-auto px-4 relative">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-2xs relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-red-500 fill-red-500" />
              <span>Today's Deals & Hot Discounts</span>
              <span className="text-[10px] text-red-500 font-bold ml-2">Up to 70% off</span>
            </h2>
            <div className="flex items-center gap-3">
              <Link href="/products" className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                <span>View all deals</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <div className="flex gap-1">
                <button
                  onClick={() => handleScroll(dealsScrollRef, 'left')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 p-1.5 rounded-full shadow-xs transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleScroll(dealsScrollRef, 'right')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 p-1.5 rounded-full shadow-xs transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {dealsLoading ? (
            <div className="flex gap-4 overflow-x-hidden py-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-52 h-64 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              ref={dealsScrollRef}
              className="flex gap-4 overflow-x-auto py-2 scrollbar-none scroll-smooth"
            >
              {deals && deals.length > 0 ? (
                deals.map((prod: any) => {
                  const salePrice = prod.discount > 0 ? (prod.price * (1 - prod.discount / 100)).toFixed(0) : prod.price;
                  return (
                    <Link
                      key={prod._id}
                      href={`/product/${prod._id}`}
                      className="w-52 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 shrink-0 flex flex-col justify-between hover:shadow-md transition group"
                    >
                      <div>
                        <div className="relative overflow-hidden rounded-md bg-slate-50 dark:bg-slate-800 h-36 flex items-center justify-center">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                          />
                          {prod.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                              {prod.discount}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-2">{prod.brand}</p>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {prod.name}
                        </h3>
                      </div>
                      
                      <div className="mt-2">
                        {/* Rating stars */}
                        <div className="flex items-center gap-0.5 text-yellow-400 text-[10px] mb-1">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-slate-650 dark:text-slate-350 font-bold ml-1">{prod.rating} ({prod.reviewsCount})</span>
                        </div>

                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                            INR {salePrice}
                          </span>
                          {prod.discount > 0 && (
                            <span className="text-[10px] text-slate-450 line-through">₹{prod.price}</span>
                          )}
                        </div>

                        {/* Delivery guarantee info */}
                        <p className="text-[9px] text-[#2874F0] font-black mt-1.5 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          <span>ShopCraft Assured</span>
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="w-full py-12 text-center text-xs text-slate-400">
                  No products found. Add products to seed.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. AI-DRIVEN SMART RECOMMENDATIONS */}
      {recs && recs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 relative">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-150" />
                <span>Recommended For You (AI-Powered)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold ml-2">Personalized match</span>
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => handleScroll(recsScrollRef, 'left')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 p-1.5 rounded-full shadow-xs transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleScroll(recsScrollRef, 'right')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 p-1.5 rounded-full shadow-xs transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={recsScrollRef}
              className="flex gap-4 overflow-x-auto py-2 scrollbar-none scroll-smooth"
            >
              {recs.map((prod: any) => (
                <Link
                  key={prod._id}
                  href={`/product/${prod._id}`}
                  className="w-52 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 shrink-0 flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-md bg-slate-50 dark:bg-slate-800 h-36 flex items-center justify-center">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 right-2 bg-indigo-650 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                        99% Match
                      </span>
                    </div>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 mt-2">{prod.brand}</p>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-0.5 text-yellow-400 text-[10px] mb-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-slate-650 dark:text-slate-350 font-bold ml-1">{prod.rating} ({prod.reviewsCount})</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">INR {prod.price}</p>
                    <p className="text-[9px] text-[#2874F0] font-black mt-1 flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3 shrink-0" />
                      <span>ShopCraft Assured</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. RECENTLY VIEWED PRODUCTS */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-2xs">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4">Inspired by your browsing history</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentlyViewed.map((prod: any) => (
                <Link
                  key={prod._id}
                  href={`/product/${prod._id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-lg flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div className="h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden p-2">
                    <img src={prod.image || prod.images?.[0]} alt={prod.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xs font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400">{prod.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold">{prod.brand}</p>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">₹{prod.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
