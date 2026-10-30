'use client';

import { useState, useEffect } from 'react';
import { getPublicCoupons, CouponCode } from '@/lib/couponsStore';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';

export default function CouponsSection() {
  const [couponsList, setCouponsList] = useState<CouponCode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCoupons() {
      const data = await getPublicCoupons();
      if (isMounted) {
        setCouponsList(data || []);
      }
    }

    loadCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!couponsList || couponsList.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % couponsList.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [couponsList]);

  // If no coupons are returned from Supabase, display empty (render nothing)
  if (!couponsList || couponsList.length === 0) {
    return null;
  }

  const currentCoupon = couponsList[currentIndex] || couponsList[0];
  if (!currentCoupon) return null;

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div
      className="sticky top-0 z-50 w-full h-10 bg-primary text-surface flex items-center justify-center px-4 overflow-hidden border-b border-secondary/20"
      role="region"
      aria-label="Promotions and Coupons"
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCoupon.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex items-center justify-center gap-2 text-xs md:text-sm font-medium tracking-wide"
          >
            {currentCoupon.sentence && (
              <span className="truncate max-w-[220px] sm:max-w-md md:max-w-xl text-surface/90 font-medium">
                {currentCoupon.sentence}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => handleCopy(currentCoupon.code, e)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 hover:bg-accent text-accent hover:text-primary transition-all duration-200 border border-accent/40 font-mono font-bold text-xs uppercase cursor-pointer select-none active:scale-95"
              title="Click to copy coupon code"
              aria-label={`Copy coupon code ${currentCoupon.code}`}
            >
              <span>{currentCoupon.code}</span>
              {copiedCode === currentCoupon.code ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-80" />
              )}
            </button>

            {copiedCode === currentCoupon.code && (
              <span className="text-[11px] text-green-400 font-semibold tracking-normal hidden sm:inline">
                Copied!
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
