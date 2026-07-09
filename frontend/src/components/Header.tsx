'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import api from '../services/api';
import {
  Search,
  Moon,
  Sun,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Package,
  MapPin,
  Menu,
  ShoppingCart,
  Percent
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // Cart total items count
  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Handle dark mode toggle
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions (debounce)
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const fetchSuggestions = async () => {
        try {
          const res = await api.get(`/products/list?limit=5&search=${searchQuery}`);
          if (res.data.success) {
            setSuggestions(res.data.products);
            setShowSuggestions(true);
          }
        } catch (err) {
          // ignore
        }
      };
      const delayDebounce = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleSuggestionClick = (productId: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    router.push(`/product/${productId}`);
  };

  return (
    <header className="z-50 shadow-md border-b border-slate-900/10 text-white font-sans transition">
      {/* 1. UPPER HEADER ROW */}
      <div className="bg-[#131921] h-14 px-4 flex items-center justify-between gap-4">
        {/* Brand Logo & Amazon Accent */}
        <Link href="/" className="flex items-center space-x-1 shrink-0 p-2 hover:border border-white/20 rounded-xs transition">
          <span className="text-xl font-black tracking-tight text-white">shop</span>
          <span className="text-xl font-black tracking-tight text-[#ff9900]">craft</span>
          <span className="text-[10px] font-black text-[#ff9900] -mt-1">.in</span>
        </Link>

        {/* Deliver indicator */}
        <div className="hidden lg:flex items-center gap-1.5 p-2 hover:border border-white/20 rounded-xs cursor-pointer transition">
          <MapPin className="h-5 w-5 text-white/95 shrink-0 self-end" />
          <div className="text-xs">
            <p className="text-slate-350 text-[10px] font-semibold leading-tight">Deliver to</p>
            <p className="text-white font-black leading-tight text-xs">
              {mounted && isAuthenticated && user ? user.name.split(' ')[0] : 'India'}
            </p>
          </div>
        </div>

        {/* Autocomplete Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-2xl relative h-10" ref={searchRef}>
          <div className="flex w-full overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-[#ff9900]">
            {/* Category selection mock button */}
            <button
              type="button"
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-r border-slate-300 text-xs px-3 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center gap-1 transition"
            >
              <span>All</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <input
              type="text"
              placeholder="Search ShopCraft.in"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="w-full bg-white dark:bg-slate-900 border-0 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm outline-hidden focus:bg-white"
            />
            {/* High contrast orange search button */}
            <button type="submit" className="bg-[#febd69] hover:bg-[#f3a847] text-[#111] px-5 flex items-center justify-center shrink-0 transition">
              <Search className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-11 left-0 right-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden text-slate-800 dark:text-slate-200">
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleSuggestionClick(product._id)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-8 w-8 object-cover rounded-md border border-slate-200 dark:border-slate-750"
                  />
                  <div className="truncate flex-1">
                    <p className="font-bold truncate text-slate-800 dark:text-slate-100">{product.name}</p>
                    <p className="text-xs text-slate-400 font-semibold">{product.brand} • INR {product.price}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Right side navigation links */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Account Lists Trigger */}
          {mounted && isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-left p-2 hover:border border-white/20 rounded-xs flex flex-col justify-center leading-tight transition cursor-pointer focus:outline-hidden"
              >
                <span className="text-slate-350 text-[10px] font-semibold">Hello, {user.name.split(' ')[0]}</span>
                <span className="text-white font-black text-xs flex items-center gap-0.5">
                  <span>Account & Lists</span>
                  <ChevronDown className="h-3 w-3" />
                </span>
              </button>

              {/* Dropdown Menu block */}
              {showDropdown && (
                <div className="absolute right-0 top-11 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl py-1 z-50 overflow-hidden text-slate-800 dark:text-slate-200">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 rounded-sm">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span>Your Account</span>
                  </Link>

                  <Link
                    href="/profile?tab=orders"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    <Package className="h-4 w-4 text-slate-400" />
                    <span>Your Orders</span>
                  </Link>

                  {/* Role Specific Panels */}
                  {user.role === 'seller' && (
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Seller Central</span>
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}

                  {user.role === 'customer' && (
                    <Link
                      href="/seller/register"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-teal-50 dark:hover:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Sell on ShopCraft</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      dispatch(logout());
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-left border-t border-slate-100 dark:border-slate-800 font-semibold"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 hover:border border-white/20 rounded-xs flex flex-col justify-center leading-tight transition cursor-pointer text-slate-100 hover:text-white"
            >
              <span className="text-slate-350 text-[10px] font-semibold">Hello, Sign in</span>
              <span className="text-white font-black text-xs">Account & Lists</span>
            </Link>
          )}

          {/* Returns & Orders */}
          <Link
            href="/profile?tab=orders"
            className="p-2 hover:border border-white/20 rounded-xs flex flex-col justify-center leading-tight transition text-slate-100 hover:text-white"
          >
            <span className="text-slate-350 text-[10px] font-semibold">Returns</span>
            <span className="text-white font-black text-xs">& Orders</span>
          </Link>

          {/* Cart Basket */}
          <Link
            href="/cart"
            className="p-2 hover:border border-white/20 rounded-xs flex items-center gap-1 transition relative hover:text-white text-slate-100"
          >
            <div className="relative flex items-center">
              <ShoppingCart className="h-7 w-7 text-white" />
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#ff9900] text-[#111] text-xs font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#131921]">
                {mounted ? cartTotalItems : 0}
              </span>
            </div>
            <span className="hidden md:inline text-xs font-black self-end pb-0.5 text-white">Cart</span>
          </Link>

          {/* Toggle Theme / Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-slate-350 hover:text-white hover:bg-slate-800/40 transition shrink-0"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY NAVIGATION department subbar */}
      <div className="bg-[#232f3e] h-10 px-4 flex items-center justify-between text-xs font-semibold overflow-x-auto scrollbar-none select-none">
        <div className="flex items-center gap-4 shrink-0">
          {/* All Dropdown icon */}
          <button className="flex items-center gap-1 text-white p-2 hover:border border-white/20 rounded-xs transition cursor-pointer">
            <Menu className="h-4 w-4" />
            <span className="font-bold">All</span>
          </button>
          
          <Link href="/products" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition">
            Fresh
          </Link>
          <Link href="/products?category=electronics" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition">
            Mobiles & Laptops
          </Link>
          <Link href="/products?category=fashion" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition">
            Fashion
          </Link>
          <Link href="/products?category=home-appliances" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition">
            Home & Kitchen
          </Link>
          <Link href="/products" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition">
            Best Sellers
          </Link>
          <Link href="/support" className="text-white/90 hover:text-white p-2 hover:border border-white/20 rounded-xs transition flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Customer Service</span>
          </Link>
          <Link href="/seller/register" className="text-[#febd69] hover:text-[#ff9900] p-2 hover:border border-white/20 rounded-xs transition flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Become a Seller</span>
          </Link>
        </div>

        {/* Custom Banners strip on right */}
        <div className="hidden lg:flex items-center gap-1 text-[#ffe11b] shrink-0 font-bold italic">
          <Percent className="h-3.5 w-3.5" />
          <span>Summer Shopping Sale - Shop Deals of the Day!</span>
        </div>
      </div>
    </header>
  );
}
