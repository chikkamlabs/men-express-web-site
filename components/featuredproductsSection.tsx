'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ImageIcon } from 'lucide-react';
import { getFeaturedProducts, FeaturedProduct } from '@/lib/featuredproductsStore';

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      try {
        setLoading(true);
        const data = await getFeaturedProducts();
        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="featured-products" className="w-full bg-background py-10 sm:py-14 md:py-20 px-4 sm:px-6 lg:px-8 border-t border-secondary/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading: SEASON'S TOP PICKS */}
        <h2 className="text-center font-bold tracking-widest text-lg sm:text-2xl md:text-3xl uppercase text-primary mb-8 sm:mb-12">
          SEASON&apos;S TOP PICKS
        </h2>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <div className="relative w-full aspect-[3/4] rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center animate-pulse">
                  <ImageIcon className="w-10 h-10 text-secondary/40" />
                </div>
                <div className="h-4 w-3/4 bg-secondary/20 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-secondary/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State: Only real data from Supabase, no dummy data */
          <div className="w-full py-12 px-6 rounded-2xl border border-dashed border-secondary/30 bg-surface/50 text-center flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-secondary mb-3" />
            <p className="text-base font-semibold text-primary">
              No featured products found
            </p>
            <p className="text-xs text-secondary mt-1">
              Products with landing_page = true will appear here.
            </p>
          </div>
        ) : (
          /* Product Grid: 2 columns on mobile, 3 or 4 on other screens */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/product?id=${encodeURIComponent(product.id)}`}
      className="flex flex-col space-y-2.5 group cursor-pointer block"
    >
      {/* Product Image Card */}
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
          /* Image symbol if no image available */
          <div className="flex flex-col items-center justify-center text-secondary gap-2">
            <ImageIcon className="w-10 h-10 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Product Title & Plus Symbol */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <h4 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-tight truncate flex-1">
          {product.name}
        </h4>
        <span className="text-primary hover:text-secondary transition-colors cursor-pointer shrink-0 p-0.5">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
      </div>

      {/* Pricing: Selling Price, MRP strikethrough, and calculated discount */}
      <div className="flex items-center flex-wrap gap-x-1.5 text-xs sm:text-sm">
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
    </Link>
  );
}
