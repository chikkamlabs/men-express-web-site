'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart, calculateCartSummary } from '@/lib/cartStore';

export default function FloatingCartBar() {
  const pathname = usePathname();
  const items = useCart();
  const summary = calculateCartSummary(items);

  // Do not show on cart or checkout pages, or if empty
  if (
    summary.itemCount === 0 ||
    pathname === '/cart' ||
    pathname === '/checkout'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[92vw] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Link
        href="/cart"
        className="flex items-center gap-3 sm:gap-4 bg-primary text-surface px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
        aria-label="View shopping cart"
      >
        {/* Glowing Cart Icon */}
        <div className="relative p-1.5 rounded-full bg-surface/10 ring-2 ring-accent shadow-[0_0_12px_rgba(184,243,74,0.7)] animate-pulse">
          <ShoppingCart className="w-4 h-4 text-accent" />
          <span className="absolute -top-1 -right-1.5 bg-accent text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {summary.itemCount}
          </span>
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-medium text-surface/80 leading-none">
            {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'} in cart
          </span>
          <span className="text-sm font-extrabold text-surface leading-tight mt-0.5">
            ₹{summary.totalSP.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Button Label */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-surface/20 text-accent font-bold text-xs uppercase tracking-wider group-hover:text-surface transition-colors">
          <span>Go to Cart</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
