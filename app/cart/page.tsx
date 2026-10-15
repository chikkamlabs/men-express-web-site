'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import {
  useCart,
  calculateCartSummary,
  updateQuantity,
  removeFromCart,
} from '@/lib/cartStore';

export default function CartPage() {
  const router = useRouter();
  const items = useCart();
  const summary = calculateCartSummary(items, 100);

  const handleQtyChange = (id: string, delta: number, currentQty: number) => {
    updateQuantity(id, currentQty + delta);
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Banner */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Cart View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-primary mb-6 sm:mb-8">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="w-full py-20 px-6 rounded-2xl border border-dashed border-secondary/30 bg-surface/60 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 text-secondary">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold uppercase text-primary">
              Your cart is empty
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1 max-w-sm">
              Looks like you haven&apos;t added any items to your cart yet. Discover our top picks and new arrivals.
            </p>
            <Link
              href="/productspage"
              className="mt-6 px-6 py-3 rounded-xl bg-primary text-surface text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart layout matching user reference screenshot */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* LEFT SIDE: Cart Items List */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {items.map((item) => {
                const itemTotal = item.s_p * item.quantity;
                const itemMrpTotal = item.mrp * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl border border-secondary/20 bg-surface shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    {/* Item Thumbnail & Basic Info */}
                    <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                      <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-secondary/20 bg-background shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="80px"
                            className="object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/product?id=${item.productId}`}
                          className="font-extrabold text-sm sm:text-base text-primary uppercase tracking-tight hover:text-secondary transition-colors truncate"
                          title={item.productName}
                        >
                          {item.productName}
                        </Link>

                        <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-background border border-secondary/20 font-bold uppercase text-[11px] text-primary">
                            {item.sizeValue}
                          </span>
                          <span className="capitalize">{item.colorName}</span>
                          <span>•</span>
                          <span>₹{item.s_p.toLocaleString('en-IN')} each</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-secondary/15">
                      {/* Pill Quantity Selector (matching screenshot) */}
                      <div className="flex items-center rounded-full border border-secondary/30 bg-background px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, -1, item.quantity)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-primary hover:bg-surface transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-8 text-center font-bold text-xs sm:text-sm text-primary">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1, item.quantity)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-primary hover:bg-surface transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total & MRP */}
                      <div className="flex flex-col items-end min-w-[80px]">
                        <span className="font-extrabold text-sm sm:text-base text-primary">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </span>
                        {itemMrpTotal > itemTotal && (
                          <span className="text-[11px] text-secondary line-through">
                            ₹{itemMrpTotal.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Trash Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-crimson hover:bg-background transition-colors cursor-pointer"
                        aria-label="Remove item"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Continue Shopping Link (matching reference image) */}
              <div className="pt-2">
                <Link
                  href="/productspage"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-secondary underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue shopping</span>
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE: Order Summary Card (matching reference image) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
              <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-5">
                <h2 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs sm:text-sm text-secondary">
                  <div className="flex items-center justify-between">
                    <span>Items Total ({summary.itemCount} items)</span>
                    <span className="font-bold text-primary">
                      ₹{summary.totalSP.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {summary.totalSavings > 0 && (
                    <div className="flex items-center justify-between text-discount font-medium">
                      <span>MRP Savings</span>
                      <span className="font-bold">
                        - ₹{summary.totalSavings.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Delivery</span>
                    <span className="font-semibold text-primary">
                      ₹{summary.deliveryCharges.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-secondary/20">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-primary block">
                        Estimated Total
                      </span>
                      <span className="text-[10px] text-secondary">
                        Inclusive of all taxes
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-primary">
                      ₹{summary.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
