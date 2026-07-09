'use client';

import React from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export default function CheckoutFailurePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-flex p-4 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 rounded-full animate-pulse">
        <XCircle className="h-12 w-12 stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">Payment Authorization Failed</h1>
        <p className="text-sm text-slate-400">
          The transaction could not be processed. This may happen due to card validation check failures or network timeouts.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Link
          href="/cart"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Cart &amp; Retry</span>
        </Link>
        <Link
          href="/support"
          className="text-xs font-bold text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Contact Chat Support</span>
        </Link>
      </div>
    </div>
  );
}
