'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-primary text-surface border-t border-secondary/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-secondary/20">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-secondary/30 bg-primary flex items-center justify-center shrink-0">
                <Image
                  src="/menexpress_logo.png"
                  alt="Men Express Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-surface uppercase">
                Men Express
              </span>
            </div>
            <p className="font-semibold text-accent text-sm tracking-wide">
              We are here for Men
            </p>
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              Your destination for modern menswear, refined fits, and enduring
              wardrobe staples tailored for ambition and everyday poise.
            </p>
          </div>

          {/* Navigation Column 1: Shop */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
              Shop
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link
                  href="/homepage#featured-products"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  New arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/productspage"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Customer */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
              Customer
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link
                  href="/profile?tab=track"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Track order
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link
                  href="/reachus"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/reachus"
                  className="hover:text-accent transition-colors block cursor-pointer"
                >
                  Reach us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <p>© 2026 Men Express. All rights reserved.</p>
          <p className="tracking-wide">
            Crafted for Men. Styled for Distinction.
          </p>
        </div>
      </div>
    </footer>
  );
}
