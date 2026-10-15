'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategories, Category } from '@/lib/categoriesStore';

export default function CategoriesSection() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setLoading(true);
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Enable horizontal scrolling when user scrolls mouse wheel over the laptop container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && container.scrollWidth > container.clientWidth) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [categories]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (categoryId?: string) => {
    if (!categoryId || categoryId === 'all') {
      router.push('/productspage');
    } else {
      router.push(`/productspage?category=${encodeURIComponent(categoryId)}`);
    }
  };

  // On mobile: 3 columns * 3 rows (max 9 categories)
  const mobileCategories = categories.slice(0, 9);

  return (
    <section className="w-full bg-background py-8 sm:py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-t border-secondary/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-primary uppercase leading-tight">
              SHOP BY
            </h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-primary uppercase leading-none mt-1">
              CATEGORY
            </h3>
            <div className="mt-2.5 sm:mt-3 w-20 sm:w-36 h-1 bg-accent rounded-full" />
          </div>

          {/* Laptop Scroll Navigation Buttons (Desktop only) */}
          {categories.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="w-10 h-10 rounded-full border border-secondary/30 bg-surface flex items-center justify-center text-primary hover:bg-background transition-colors cursor-pointer"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="w-10 h-10 rounded-full border border-secondary/30 bg-surface flex items-center justify-center text-primary hover:bg-background transition-colors cursor-pointer"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <>
            {/* Mobile Loading Skeleton: 3 cols x 3 rows */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:hidden py-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-1.5">
                  <div className="h-4 w-14 mx-auto bg-secondary/20 rounded animate-pulse" />
                  <div className="aspect-square w-full rounded-xl bg-surface border border-secondary/20 flex items-center justify-center animate-pulse">
                    <ImageIcon className="w-6 h-6 text-secondary/40" />
                  </div>
                </div>
              ))}
            </div>

            {/* Laptop Loading Skeleton */}
            <div className="hidden md:flex gap-6 overflow-x-hidden py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0 w-64 flex flex-col space-y-3">
                  <div className="h-6 w-28 bg-secondary/20 rounded-md animate-pulse" />
                  <div className="w-full h-72 rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center animate-pulse">
                    <ImageIcon className="w-10 h-10 text-secondary/40" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : categories.length === 0 ? (
          /* Empty State */
          <div className="w-full py-12 px-6 rounded-2xl border border-dashed border-secondary/30 bg-surface/50 text-center flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-secondary mb-3" />
            <p className="text-base font-semibold text-primary">
              No categories found
            </p>
            <p className="text-xs text-secondary mt-1">
              Categories added to Supabase will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: 3 columns * 3 rows (max 9 items), decreased size */}
            <div className="md:hidden">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                {mobileCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{
                      duration: 0.35,
                      delay: (index % 3) * 0.08,
                      ease: 'easeOut',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      className="w-full text-left focus:outline-none cursor-pointer"
                    >
                      <MobileCategoryCard category={category} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* LAPTOP VIEW: Unchanged horizontal scroll list */}
            <div
              ref={scrollContainerRef}
              className="hidden md:flex gap-6 sm:gap-8 overflow-x-auto pb-6 pt-2 scroll-smooth scrollbar-thin select-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category.id)}
                  className="text-left focus:outline-none cursor-pointer shrink-0"
                >
                  <LaptopCategoryCard category={category} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* SHOP ALL - open productspage displaying all */}
        <div className="mt-6 md:mt-8 pt-1">
          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className="inline-block text-xs sm:text-sm md:text-base font-bold tracking-wider text-primary uppercase underline underline-offset-4 cursor-pointer hover:text-secondary transition-colors"
          >
            SHOP ALL
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Mobile Category Card (3 columns x 3 rows grid)
 */
function MobileCategoryCard({ category }: { category: Category }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = category.image_url || category.image;

  return (
    <div className="flex flex-col space-y-1.5 w-full group">
      {/* Category Name on Top */}
      <h4 className="text-[11px] sm:text-xs font-bold tracking-tight text-primary uppercase text-center truncate px-0.5 group-hover:text-secondary transition-colors">
        {category.name}
      </h4>

      {/* Decreased compact image box */}
      <div className="relative w-full aspect-square rounded-xl border border-secondary/20 bg-surface flex items-center justify-center overflow-hidden p-1.5 shadow-xs group-hover:border-primary/40 transition-colors">
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 110px, 140px"
            className="object-contain p-1 group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center text-secondary">
            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Laptop Category Card
 */
function LaptopCategoryCard({ category }: { category: Category }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = category.image_url || category.image;

  return (
    <div className="w-60 sm:w-64 flex flex-col space-y-3 group">
      {/* Category Name on Top */}
      <h4 className="text-base sm:text-lg font-bold tracking-tight text-primary uppercase truncate group-hover:text-secondary transition-colors">
        {category.name}
      </h4>

      {/* Category Image Box */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl border border-secondary/20 bg-surface flex items-center justify-center overflow-hidden p-4 shadow-xs group-hover:border-primary/40 transition-all">
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 240px, 256px"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-secondary gap-2">
            <ImageIcon className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}
      </div>
    </div>
  );
}
