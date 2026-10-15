'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  SlidersHorizontal,
  Search,
  X,
  Check,
  Plus,
  ImageIcon,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import { getCategories, Category } from '@/lib/categoriesStore';
import { getProducts, ProductItem } from '@/lib/productsStore';

import Link from 'next/link';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Category filter is driven directly by URL searchParams for clean synchronization
  const selectedCategoryId = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');

  // Load categories
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      try {
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load products from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await getProducts({
          categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
          search: searchQuery.trim().length > 0 ? searchQuery.trim() : undefined,
        });

        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Error loading products from Supabase:', err);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId, searchQuery]);

  // Find currently selected category details
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === 'all') return null;
    return categories.find(
      (c) =>
        c.id.toLowerCase() === selectedCategoryId.toLowerCase() ||
        (c.cat_id && c.cat_id.toLowerCase() === selectedCategoryId.toLowerCase()) ||
        c.name.toLowerCase() === selectedCategoryId.toLowerCase()
    );
  }, [categories, selectedCategoryId]);

  // Filter categories for the category search inside the filter modal
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categories;
    const q = categorySearchQuery.trim().toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearchQuery]);

  const handleApplyCategoryFilter = (catId: string) => {
    setFilterModalOpen(false);
    if (catId === 'all') {
      router.push('/productspage');
    } else {
      router.push(`/productspage?category=${encodeURIComponent(catId)}`);
    }
  };

  const handleClearCategoryFilter = () => {
    router.push('/productspage');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Top promotional coupons section */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Products Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {/* Top Controls: Search bar & Filters button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-6 border-b border-secondary/15">
          {/* Left: Section Title & Active filter indicator */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-primary">
                {activeCategory ? activeCategory.name : 'ALL PRODUCTS'}
              </h1>
              {!loading && (
                <span className="text-xs sm:text-sm font-semibold text-secondary">
                  ({products.length})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Explore premium menswear and contemporary wardrobe essentials
            </p>
          </div>

          {/* Right: Search Bar & Filters Action Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            {/* Product Name Search Bar */}
            <div className="relative flex-1 md:w-72 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-9.5 pr-8 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary placeholder:text-secondary/70 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary p-0.5"
                  aria-label="Clear product search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer shrink-0 ${
                activeCategory
                  ? 'bg-primary text-surface border-primary shadow-xs'
                  : 'bg-surface text-primary border-secondary/25 hover:border-primary'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeCategory && (
                <span className="w-2 h-2 rounded-full bg-accent ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(activeCategory || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 pb-2">
            <span className="text-xs font-medium text-secondary">Active filters:</span>

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-secondary/30 text-xs font-semibold text-primary uppercase">
                <span>Category: {activeCategory.name}</span>
                <button
                  type="button"
                  onClick={handleClearCategoryFilter}
                  className="hover:text-crimson p-0.5 transition-colors cursor-pointer"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-secondary/30 text-xs font-semibold text-primary">
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-crimson p-0.5 transition-colors cursor-pointer"
                  aria-label="Remove search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                handleClearCategoryFilter();
                setSearchQuery('');
              }}
              className="text-xs text-secondary hover:text-primary underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Product Grid Area: 4 columns desktop, 2 columns mobile */}
        <div className="mt-6">
          {loading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2.5">
                  <div className="relative w-full aspect-[3/4] rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center animate-pulse">
                    <ImageIcon className="w-8 h-8 text-secondary/30" />
                  </div>
                  <div className="h-4 w-3/4 bg-secondary/20 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-secondary/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State: Only real data, no mock items */
            <div className="w-full py-16 px-6 rounded-2xl border border-dashed border-secondary/30 bg-surface/50 text-center flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-secondary mb-3 stroke-[1.5]" />
              <p className="text-base font-bold text-primary">No products found</p>
              <p className="text-xs text-secondary mt-1 max-w-sm">
                {activeCategory || searchQuery
                  ? 'No products matched your selected category or search filter. Try clearing filters.'
                  : 'Products from Supabase will automatically appear here once added.'}
              </p>
              {(activeCategory || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearCategoryFilter();
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-surface text-xs font-semibold hover:bg-charcoal transition-colors cursor-pointer"
                >
                  Show all products
                </button>
              )}
            </div>
          ) : (
            /* 4 Columns Desktop & 2 Columns Mobile */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCardItem key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 4. Filter Modal Dialog (Category Filter with Search & Selection) */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface rounded-2xl border border-secondary/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-primary uppercase tracking-tight">
                  Filter by Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-background transition-colors cursor-pointer"
                aria-label="Close filter modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Search Input */}
            <div className="p-4 border-b border-secondary/15 bg-background/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category List */}
            <div className="p-4 overflow-y-auto space-y-1.5 flex-1">
              {/* Option 1: All Categories */}
              <button
                type="button"
                onClick={() => handleApplyCategoryFilter('all')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategoryId === 'all' || !selectedCategoryId
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-secondary/15 hover:border-secondary/40 text-text'
                }`}
              >
                <span className="uppercase">All Categories</span>
                {(selectedCategoryId === 'all' || !selectedCategoryId) && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>

              {/* Supabase Categories */}
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => {
                  const isSelected =
                    selectedCategoryId.toLowerCase() === category.id.toLowerCase() ||
                    (category.cat_id &&
                      selectedCategoryId.toLowerCase() === category.cat_id.toLowerCase()) ||
                    selectedCategoryId.toLowerCase() === category.name.toLowerCase();

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleApplyCategoryFilter(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-bold'
                          : 'border-secondary/15 hover:border-secondary/40 text-text font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        {category.image_url || category.image ? (
                          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-secondary/20 bg-surface shrink-0">
                            <Image
                              src={category.image_url || category.image!}
                              alt={category.name}
                              fill
                              className="object-contain p-0.5"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : null}
                        <span className="uppercase truncate">{category.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-secondary">
                  No matching category found
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary/20 bg-background/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearCategoryFilter}
                className="px-4 py-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                Reset to All
              </button>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-surface text-xs font-bold hover:bg-charcoal transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}

/**
 * Product Card Item
 * Matches Featured Product & Reference Screenshot Layout:
 * - NEW DROP badge
 * - Front Image
 * - Title + Plus icon
 * - Selling price, MRP (strikethrough), Discount percentage
 * - Best price (10% instant discount / offer)
 * - Available colors below price (rounded circle filled with color)
 */
function ProductCardItem({ product }: { product: ProductItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/product?id=${encodeURIComponent(product.id)}`}
      className="flex flex-col space-y-2.5 group cursor-pointer block"
    >
      {/* Product Image Box */}
      <div className="relative w-full aspect-[3/4] rounded-2xl border border-secondary/20 bg-surface overflow-hidden flex items-center justify-center shadow-xs">
        {/* NEW DROP Badge */}
        <span className="absolute top-2.5 left-2.5 z-10 bg-primary text-surface text-[9px] sm:text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
          NEW DROP
        </span>

        {!imageError && product.front_image_url ? (
          <Image
            src={product.front_image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-secondary gap-2">
            <ImageIcon className="w-10 h-10 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Product Title & Plus Symbol */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <h4 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-tight truncate flex-1" title={product.name}>
          {product.name}
        </h4>
        <span
          className="text-primary hover:text-secondary transition-colors cursor-pointer shrink-0 p-0.5"
          aria-label="View product"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
      </div>

      {/* Pricing: Selling Price, MRP strikethrough, Discount % */}
      <div className="flex items-center flex-wrap gap-x-1.5 text-xs sm:text-sm leading-none">
        <span className="font-bold text-primary">
          ₹{product.s_p.toLocaleString('en-IN')}
        </span>

        {product.mrp > product.s_p && (
          <span className="text-secondary line-through text-[11px] sm:text-xs">
            ₹{product.mrp.toLocaleString('en-IN')}
          </span>
        )}

        {product.discount > 0 && (
          <span className="text-discount font-bold text-[11px] sm:text-xs">
            ({product.discount}% OFF)
          </span>
        )}
      </div>

      {/* Best price indicator (matching reference screenshot) */}
      {product.best_price > 0 && (
        <div className="text-[11px] sm:text-xs text-discount font-semibold leading-none">
          Best price ₹{product.best_price.toLocaleString('en-IN')}
        </div>
      )}

      {/* Available colors below price: rounded circle filled with color */}
      {product.colors && product.colors.length > 0 && (
        <div className="pt-0.5 flex items-center gap-1.5 flex-wrap" aria-label="Available colors">
          {product.colors.map((color) => {
            const isWhiteOrLight =
              color.code.toLowerCase() === '#ffffff' ||
              color.code.toLowerCase() === '#fff' ||
              color.code.toLowerCase() === 'white';

            return (
              <span
                key={color.id}
                title={color.name}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-2xs transition-transform hover:scale-125 ${
                  isWhiteOrLight ? 'border border-secondary/40' : 'border border-black/10'
                }`}
                style={{ backgroundColor: color.code }}
              />
            );
          })}
        </div>
      )}
    </Link>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
