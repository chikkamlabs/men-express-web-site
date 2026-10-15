'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Minus,
  ImageIcon,
  ArrowLeft,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import {
  getProductById,
  getColorImages,
  getColorVariants,
  ProductDetail,
  ProductColorDetail,
  ProductVariantDetail,
  ColorImageItem,
} from '@/lib/productsStore';
import { addToCart } from '@/lib/cartStore';

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');

  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));
  const [product, setProduct] = useState<ProductDetail | null>(null);

  // Selected Colorway
  const [selectedColor, setSelectedColor] = useState<ProductColorDetail | null>(null);

  // Images for the selected colorway
  const [colorImages, setColorImages] = useState<ColorImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Variants and sizes for the selected colorway
  const [variants, setVariants] = useState<ProductVariantDetail[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDetail | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Quantity selector & added feedback state
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // 1. Fetch product by ID
  useEffect(() => {
    let isMounted = true;
    if (!productId) {
      return;
    }

    async function fetchProduct() {
      try {
        setLoadingProduct(true);
        const data = await getProductById(productId!);
        if (isMounted) {
          setProduct(data);
          if (data && data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        if (isMounted) {
          setLoadingProduct(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // 2. When selectedColor changes, load that color's images and variants from Supabase
  useEffect(() => {
    let isMounted = true;
    if (!selectedColor) return;

    async function loadColorData() {
      try {
        setLoadingImages(true);
        setLoadingVariants(true);

        const [imgs, vars] = await Promise.all([
          getColorImages(selectedColor!.id),
          getColorVariants(selectedColor!.id),
        ]);

        if (isMounted) {
          setColorImages(imgs);
          if (imgs.length > 0) {
            setSelectedImage(imgs[0].image_url);
          } else if (selectedColor!.image_url) {
            setSelectedImage(selectedColor!.image_url);
          } else {
            setSelectedImage(null);
          }

          setVariants(vars);
          if (vars.length > 0) {
            setSelectedVariant(vars[0]);
          } else {
            setSelectedVariant(null);
          }
        }
      } catch (err) {
        console.error('Error loading color images or variants:', err);
      } finally {
        if (isMounted) {
          setLoadingImages(false);
          setLoadingVariants(false);
        }
      }
    }

    loadColorData();

    return () => {
      isMounted = false;
    };
  }, [selectedColor]);

  const handleColorSelect = (color: ProductColorDetail) => {
    if (selectedColor?.id === color.id) return;
    setSelectedColor(color);
  };

  const handleSizeSelect = (variant: ProductVariantDetail) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant || !selectedColor) return;

    addToCart({
      productId: product.id,
      productName: product.name,
      fit: product.fit,
      variantId: selectedVariant.id,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      sizeId: selectedVariant.size_id,
      sizeValue: selectedVariant.size_value,
      imageUrl: selectedImage || selectedColor.image_url,
      mrp: selectedVariant.mrp,
      s_p: selectedVariant.s_p,
      quantity,
    });

    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2200);
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-text">
        <CouponsSection />
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
            <div className="lg:col-span-6 aspect-[4/5] max-w-md mx-auto w-full bg-surface rounded-2xl border border-secondary/20" />
            <div className="lg:col-span-6 space-y-6">
              <div className="h-8 bg-secondary/20 rounded-md w-3/4" />
              <div className="h-6 bg-secondary/20 rounded-md w-1/3" />
              <div className="h-24 bg-surface rounded-2xl border border-secondary/20" />
              <div className="h-24 bg-surface rounded-2xl border border-secondary/20" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-text">
        <CouponsSection />
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <ImageIcon className="w-16 h-16 text-secondary mb-4 stroke-[1.5]" />
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-primary">
            Product Not Found
          </h2>
          <p className="text-sm text-secondary mt-1">
            The requested product could not be found in the database.
          </p>
          <button
            type="button"
            onClick={() => router.push('/productspage')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-surface text-xs sm:text-sm font-semibold hover:bg-charcoal transition-colors cursor-pointer"
          >
            Back to Products
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Active pricing calculation based on selected variant
  const mrp = selectedVariant ? selectedVariant.mrp : 0;
  const sp = selectedVariant ? selectedVariant.s_p : 0;
  const discount = selectedVariant ? selectedVariant.discount : 0;

  // Check if second image is currently selected
  const isSecondImageSelected =
    colorImages.length > 1 && selectedImage === colorImages[1].image_url;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Section */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Product Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center gap-2 text-xs text-secondary">
          <Link
            href="/productspage"
            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Shop All Products</span>
          </Link>
          <span>/</span>
          {product.category_name && (
            <>
              <span className="uppercase">{product.category_name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-primary font-medium uppercase truncate max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Responsive Grid: Desktop 2 columns (left decreased images, right details) / Mobile column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT SIDE: Images for Selected Color (Decreased size) */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-4 items-center md:items-start justify-center">
            {/* Thumbnail vertical list (Desktop side, mobile horizontal below) */}
            {colorImages.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[460px] shrink-0 pb-2 md:pb-0 scrollbar-thin">
                {colorImages.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      selectedImage === img.image_url
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-secondary/20 hover:border-secondary/50 opacity-70 hover:opacity-100'
                    }`}
                    title={idx === 1 ? 'View fabric, collar & fit specifications' : `View image ${idx + 1}`}
                  >
                    <Image
                      src={img.image_url}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Decreased Main Featured Image Box for Selected Color */}
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[4/5] rounded-2xl border border-secondary/20 bg-surface overflow-hidden flex items-center justify-center shadow-xs mx-auto md:mx-0">
              {/* NEW DROP Badge */}
              <span className="absolute top-3.5 left-3.5 z-10 bg-primary text-surface text-[9px] sm:text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
                NEW DROP
              </span>

              {loadingImages ? (
                <div className="flex flex-col items-center justify-center text-secondary gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs">Loading image...</span>
                </div>
              ) : selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 340px, 400px"
                  className="object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-secondary gap-2 p-8 text-center">
                  <ImageIcon className="w-14 h-14 stroke-[1.5]" />
                  <span className="text-xs">No image available for this color</span>
                </div>
              )}

              {/* TRANSPARENT DETAILS SECTION: Shown when 2nd image is selected */}
              {isSecondImageSelected && (
                <div className="absolute inset-x-3 bottom-3 p-3.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-surface z-20 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-xl">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      Fabric & Fit Specifications
                    </span>
                    <span className="text-[9px] text-surface/70 uppercase">Image 2 of {colorImages.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-left">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-surface/70 font-semibold">
                        Fit
                      </span>
                      <span className="font-bold text-xs text-surface uppercase truncate block">
                        {product.fit || 'Regular Fit'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-surface/70 font-semibold">
                        Collar
                      </span>
                      <span className="font-bold text-xs text-surface uppercase truncate block">
                        {product.collar || 'Spread Collar'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-surface/70 font-semibold">
                        Fabric
                      </span>
                      <span className="font-bold text-xs text-surface uppercase truncate block">
                        {product.fabric || '100% Cotton'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Product Name, Colors, Sizes, Price & Add to Cart */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            {/* Title & Category/Fit */}
            <div className="border-b border-secondary/15 pb-5">
              {product.fit && (
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  {product.fit}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-primary mt-1">
                {product.name}
              </h1>

              {/* Pricing Section (fetched from product_variants) - Best price line removed */}
              <div className="mt-4 flex flex-col space-y-1.5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-primary">
                    ₹{sp.toLocaleString('en-IN')}
                  </span>

                  {mrp > sp && (
                    <span className="text-base sm:text-lg text-secondary line-through font-normal">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                  )}

                  {discount > 0 && (
                    <span className="text-base sm:text-lg text-discount font-bold">
                      ({discount}% OFF)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-secondary">
                  Inclusive of all taxes
                </p>
              </div>
            </div>

            {/* AVAILABLE COLORS (displays color name and image thumbnail) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-primary uppercase">
                  Available Colors:
                </span>
                {selectedColor && (
                  <span className="font-semibold text-secondary uppercase">
                    {selectedColor.name}
                  </span>
                )}
              </div>

              {product.colors && product.colors.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor?.id === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'border-secondary/20 hover:border-secondary/50 bg-surface'
                        }`}
                      >
                        {/* Thumbnail Image */}
                        <div className="relative w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden border border-secondary/20 bg-background flex items-center justify-center">
                          {color.image_url ? (
                            <Image
                              src={color.image_url}
                              alt={color.name}
                              fill
                              sizes="64px"
                              className="object-cover object-top group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span
                              className="w-6 h-6 rounded-full border border-secondary/30"
                              style={{ backgroundColor: color.code }}
                            />
                          )}

                          {isSelected && (
                            <span className="absolute top-1 right-1 bg-primary text-surface rounded-full p-0.5 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Color Name */}
                        <span className="text-[11px] font-bold text-primary uppercase mt-1.5 truncate max-w-[64px]">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-secondary">
                  No color variants available.
                </p>
              )}
            </div>

            {/* SIZES FOR SELECTED COLOR (fetched from product_variants) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-primary uppercase">
                  Select Size:
                </span>
                {selectedVariant && (
                  <span className="font-semibold text-secondary uppercase">
                    Size: {selectedVariant.size_value}
                  </span>
                )}
              </div>

              {loadingVariants ? (
                <div className="flex gap-2 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-10 bg-secondary/20 rounded-xl" />
                  ))}
                </div>
              ) : variants.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isOutOfStock = v.quantity <= 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSizeSelect(v)}
                        disabled={isOutOfStock}
                        className={`min-w-12 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          isOutOfStock
                            ? 'border-secondary/15 bg-secondary/10 text-secondary/40 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-primary bg-primary text-surface shadow-xs ring-2 ring-primary/20'
                            : 'border-secondary/25 bg-surface text-primary hover:border-primary'
                        }`}
                      >
                        {v.size_value}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-secondary">
                  No sizes available for the selected color.
                </p>
              )}
            </div>

            {/* QUANTITY & ADD TO CART BUTTON */}
            <div className="space-y-3 pt-4 border-t border-secondary/15">
              <span className="block text-xs font-bold text-primary uppercase">
                Quantity:
              </span>

              <div className="flex items-center gap-4">
                {/* Quantity selector */}
                <div className="flex items-center rounded-xl border border-secondary/25 bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="w-10 text-center font-bold text-sm text-primary">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-background transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* ADD TO CART (+) BUTTON */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.quantity <= 0}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                    addedToast
                      ? 'bg-discount text-surface'
                      : 'bg-primary text-surface hover:bg-charcoal'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Product Guarantees / Details */}
            <div className="pt-6 border-t border-secondary/15 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-secondary">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary" />
                <span>Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>Easy 7-Day Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>100% Genuine</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
