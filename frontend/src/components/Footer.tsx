'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#232F3E] text-slate-300 font-sans text-xs">
      {/* 1. BACK TO TOP BAR */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#37475a] hover:bg-[#485769] text-white py-3 text-center font-bold tracking-wide transition cursor-pointer"
      >
        Back to top
      </button>

      {/* 2. MAIN FOOTER GRIDS */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <h4 className="text-white text-sm font-black uppercase tracking-wider">Get to Know Us</h4>
          <ul className="space-y-2 text-slate-350">
            <li><Link href="/" className="hover:underline">About ShopCraft</Link></li>
            <li><Link href="/" className="hover:underline">Careers</Link></li>
            <li><Link href="/" className="hover:underline">Press Releases</Link></li>
            <li><Link href="/" className="hover:underline">ShopCraft Science</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white text-sm font-black uppercase tracking-wider">Connect with Us</h4>
          <ul className="space-y-2 text-slate-350">
            <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:underline">Facebook</a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:underline">Twitter</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline">Instagram</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white text-sm font-black uppercase tracking-wider">Make Money with Us</h4>
          <ul className="space-y-2 text-slate-350 font-semibold">
            <li><Link href="/seller/register" className="text-[#febd69] hover:underline">Sell on ShopCraft</Link></li>
            <li><Link href="/seller/register" className="hover:underline">Supply to ShopCraft</Link></li>
            <li><Link href="/" className="hover:underline">Become an Affiliate</Link></li>
            <li><Link href="/" className="hover:underline">Advertise Your Products</Link></li>
            <li><Link href="/seller/register" className="hover:underline">Fulfillment by ShopCraft</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white text-sm font-black uppercase tracking-wider">Let Us Help You</h4>
          <ul className="space-y-2 text-slate-350">
            <li><Link href="/profile" className="hover:underline">Your Account</Link></li>
            <li><Link href="/profile?tab=orders" className="hover:underline">Returns Center</Link></li>
            <li><Link href="/support" className="hover:underline">Help & Support</Link></li>
            <li><Link href="/support" className="hover:underline">AI Chat Assistant</Link></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700 max-w-6xl mx-auto"></div>

      {/* 3. SUB-FOOTER BRAND & COUNTRY LIST */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center space-y-4 text-center">
        <Link href="/" className="flex items-center space-x-1">
          <span className="text-lg font-black tracking-tight text-white">shop</span>
          <span className="text-lg font-black tracking-tight text-[#ff9900]">craft</span>
        </Link>
        
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-slate-400 max-w-2xl leading-relaxed">
          <span className="hover:underline cursor-pointer">Australia</span>
          <span className="hover:underline cursor-pointer">Brazil</span>
          <span className="hover:underline cursor-pointer">Canada</span>
          <span className="hover:underline cursor-pointer">China</span>
          <span className="hover:underline cursor-pointer">France</span>
          <span className="hover:underline cursor-pointer">Germany</span>
          <span className="hover:underline cursor-pointer">Italy</span>
          <span className="hover:underline cursor-pointer">Japan</span>
          <span className="hover:underline cursor-pointer">Mexico</span>
          <span className="hover:underline cursor-pointer">Netherlands</span>
          <span className="hover:underline cursor-pointer">United Kingdom</span>
          <span className="hover:underline cursor-pointer">United States</span>
        </div>
      </div>

      {/* 4. LEGAL SUB-FOOTER */}
      <div className="bg-[#131a22] py-8 text-center text-[10px] text-slate-400 space-y-2">
        <div className="flex justify-center space-x-4">
          <Link href="/" className="hover:underline">Conditions of Use</Link>
          <Link href="/" className="hover:underline">Privacy Notice</Link>
          <Link href="/" className="hover:underline">Interest-Based Ads</Link>
        </div>
        <p>&copy; {new Date().getFullYear()}, ShopCraft.in, Inc. or its affiliates. All rights reserved.</p>
      </div>
    </footer>
  );
}
