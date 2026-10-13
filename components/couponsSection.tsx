'use client';

import { useState, useEffect } from 'react';
import { coupons } from '@/lib/coupons';
import { motion, AnimatePresence } from 'motion/react';

export default function CouponsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!coupons || coupons.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % coupons.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const currentCoupon = coupons[currentIndex] || coupons[0];

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
            className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wider cursor-default select-none hover:text-accent transition-colors"
          >
            <span>{currentCoupon.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
