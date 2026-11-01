'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  XCircle,
  ArrowLeft,
  RotateCcw,
  Phone,
  ShoppingBag,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const reason = searchParams.get('reason') || 'Transaction was cancelled or declined by your bank.';

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-12 sm:py-16 text-center flex flex-col items-center justify-center">
      <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-lg w-full space-y-6">
        <div className="w-16 h-16 rounded-full bg-crimson/15 text-crimson flex items-center justify-center mx-auto">
          <XCircle className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase text-primary tracking-tight">
            Payment Not Completed
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            We were unable to process your payment via Cashfree.
          </p>
        </div>

        {/* Details Card */}
        <div className="p-5 rounded-2xl bg-background border border-secondary/25 space-y-3 text-left">
          {orderId && (
            <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
              <span className="text-xs font-bold uppercase text-secondary">Order ID</span>
              <span className="text-sm font-black text-primary font-mono">{orderId}</span>
            </div>
          )}

          <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
            <span className="text-xs font-bold uppercase text-secondary">Gateway</span>
            <span className="text-xs font-bold text-primary uppercase">Cashfree PG</span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-xs font-bold uppercase text-secondary block">Reason</span>
            <p className="text-xs text-crimson font-medium bg-crimson/5 p-2.5 rounded-lg border border-crimson/20">
              {reason}
            </p>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="space-y-3 pt-2">
          <Link
            href="/checkout"
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs uppercase tracking-wider hover:bg-charcoal transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-accent" />
            <span>Try Again at Checkout</span>
          </Link>

          <a
            href={`https://wa.me/919912999344?text=${encodeURIComponent(
              `Hello MEN EXPRESS, my payment for order ${orderId || 'checkout'} failed. Please help!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-xl bg-discount/10 border border-discount/30 text-discount font-bold text-xs uppercase tracking-wider hover:bg-discount/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Contact Support on WhatsApp (+91 9912999344)</span>
          </a>

          <Link
            href="/productspage"
            className="w-full py-3 px-6 rounded-xl bg-surface border border-secondary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CashfreeFailedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <CouponsSection />
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <span className="text-xs text-secondary">Loading details...</span>
            </div>
          }
        >
          <FailedContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
