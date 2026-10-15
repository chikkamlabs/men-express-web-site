'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { getCategories, Category } from '@/lib/categoriesStore';
import { useCart } from '@/lib/cartStore';

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHoveringShopAll, setIsHoveringShopAll] = useState(false);
  const cartItems = useCart();
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCats() {
      try {
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories in header:', err);
      }
    }
    fetchCats();

    return () => {
      isMounted = false;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoveringShopAll(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoveringShopAll(false);
    }, 180);
  };

  const handleSelectCategory = (categoryId?: string) => {
    setIsHoveringShopAll(false);
    setMobileMenuOpen(false);
    if (!categoryId || categoryId === 'all') {
      router.push('/productspage');
    } else {
      router.push(`/productspage?category=${encodeURIComponent(categoryId)}`);
    }
  };

  return (
    <header className="sticky top-10 z-40 w-full bg-surface border-b border-secondary/20 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo & Brand Name */}
        <Link href="/homepage" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-secondary/30 bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/menexpress_logo.png"
              alt="Men Express Logo"
              width={40}
              height={40}
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tight text-primary uppercase">
            Men Express
          </span>
        </Link>

        {/* Middle Right: Tagline (Desktop visible, mobile hidden) */}
        <div className="hidden md:flex items-center">
          <span className="font-bold text-base lg:text-lg text-primary tracking-wide">
            We are here for Men
          </span>
        </div>

        {/* Desktop Navigation & Icons */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text">
          {/* Shop All with Dropdown on Hover */}
          <div
            className="relative py-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none cursor-pointer font-semibold"
            >
              <span>Shop All</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isHoveringShopAll ? 'rotate-180 text-primary' : 'text-secondary'
                }`}
              />
            </button>

            {/* Hover Dropdown Menu */}
            {isHoveringShopAll && (
              <div
                className="absolute left-0 top-full -mt-1 w-64 bg-surface rounded-xl border border-secondary/20 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* All Categories Option */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-primary hover:bg-background flex items-center justify-between transition-colors border-b border-secondary/15 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-discount" />
                    All Categories
                  </span>
                  <span className="text-[10px] text-secondary font-medium tracking-normal">
                    View All
                  </span>
                </button>

                {/* Categories available from Supabase */}
                <div className="max-h-72 overflow-y-auto py-1">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelectCategory(category.id)}
                        className="w-full text-left px-4 py-2 text-xs uppercase font-medium text-text hover:text-primary hover:bg-background transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-secondary text-center">
                      No categories found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/reachus"
            className="hover:text-primary transition-colors cursor-pointer font-medium"
          >
            Reach us
          </Link>
          <Link
            href="/cart"
            className={`relative flex items-center justify-center p-1.5 rounded-full text-primary hover:text-secondary transition-all cursor-pointer ${
              cartCount > 0
                ? 'ring-2 ring-accent shadow-[0_0_12px_rgba(184,243,74,0.65)] animate-pulse'
                : ''
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className="flex items-center justify-center text-primary hover:text-secondary transition-colors cursor-pointer p-1"
            aria-label="User Profile & Order Tracking"
            title="Track Orders & Profile"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* Mobile Header: Only Cart symbol on header and 3 lines (hamburger menu) */}
        <div className="flex md:hidden items-center gap-4 text-primary">
          <Link
            href="/cart"
            className={`relative flex items-center justify-center p-1.5 rounded-full text-primary hover:text-secondary transition-all cursor-pointer ${
              cartCount > 0
                ? 'ring-2 ring-accent shadow-[0_0_12px_rgba(184,243,74,0.65)] animate-pulse'
                : ''
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-background transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel: 3 lines content */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-secondary/20 bg-surface px-4 py-4 shadow-md transition-all">
          <nav className="flex flex-col space-y-2 text-base font-semibold text-text">
            {/* Shop All Direct Link */}
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="py-2.5 px-3 rounded-xl hover:bg-background text-primary font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Shop All (All Products)</span>
              <Sparkles className="w-4 h-4 text-discount" />
            </button>

            {/* Categories expandable accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                className="w-full py-2.5 px-3 rounded-xl hover:bg-background text-primary font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileCategoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileCategoriesOpen && (
                <div className="ml-3 pl-3 border-l-2 border-secondary/20 my-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    className="w-full text-left py-2 px-2 text-sm text-primary font-semibold hover:bg-background rounded-lg cursor-pointer"
                  >
                    • All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="w-full text-left py-2 px-2 text-sm text-secondary hover:text-primary hover:bg-background rounded-lg cursor-pointer uppercase truncate"
                    >
                      • {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/reachus"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-background text-primary transition-colors cursor-pointer block"
            >
              Reach us
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-background text-primary transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Profile & Track Order</span>
              <User className="w-4 h-4 text-secondary" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
