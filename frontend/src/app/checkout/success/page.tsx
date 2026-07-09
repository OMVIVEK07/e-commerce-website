'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

function SuccessDetails() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'INV-MOCK-ID';

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-flex p-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full animate-bounce">
        <CheckCircle className="h-12 w-12 stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Payment Successful!</h1>
        <p className="text-sm text-slate-400">
          Your order has been verified and processed. A PDF copy of the invoice was generated and emailed to you.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs font-semibold">
        <span className="text-slate-400 uppercase tracking-wider block mb-1">Order Tracking Reference</span>
        <span className="font-extrabold text-slate-800 dark:text-slate-250 select-all font-mono text-sm">{orderId}</span>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Link
          href="/profile?tab=orders"
          className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition"
        >
          <Package className="h-4 w-4" />
          <span>Track Order Progress</span>
        </Link>
        <Link
          href="/products"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading payment details...</div>}>
      <SuccessDetails />
    </Suspense>
  );
}
