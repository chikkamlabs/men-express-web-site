import { supabase } from './supabase';

export interface FeaturedProduct {
  id: string; // products.id
  prod_id?: string;
  name: string;
  fit?: string | null;
  product_color_id: string;
  front_image_url: string | null;
  mrp: number;
  s_p: number;
  discount: number; // percentage discount (mrp vs s_p)
}

/**
 * Fetches featured products for the landing page following the required steps:
 * Step 1: Find products.id where products.landing_page = true
 * Step 2: Find front_image url from product_colors.front_image and product_colors.id where product_colors.product_id = step 1 result
 * Step 3: Find mrp and s_p from product_variants where product_color_id = step 2 result product_colors.id
 * Calculates discount from MRP and selling price.
 */
export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    // Step 1: Find the products.id where products.landing_page = true
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, prod_id, name, fit, status, landing_page')
      .eq('landing_page', true);

    if (prodError) {
      console.error('Error in Step 1 (fetching products):', prodError.message);
      return [];
    }

    if (!products || products.length === 0) {
      return [];
    }

    // Filter active products
    const activeProducts = products.filter((p) => p.status !== false);
    if (activeProducts.length === 0) {
      return [];
    }

    const productIds = activeProducts.map((p) => p.id);

    // Step 2: Find get front_image url from product_colors.front_image and product_colors.id where product_colors.product_id = step 1 result
    const { data: productColors, error: colorsError } = await supabase
      .from('product_colors')
      .select('id, product_id, color_id, front_image, status')
      .in('product_id', productIds);

    if (colorsError) {
      console.error('Error in Step 2 (fetching product_colors):', colorsError.message);
      return [];
    }

    if (!productColors || productColors.length === 0) {
      return [];
    }

    const activeColors = productColors.filter((pc) => pc.status !== false);
    const productColorIds = activeColors.map((pc) => pc.id);

    // Retrieve image records from product_color_images
    const { data: colorImages, error: imagesError } = await supabase
      .from('product_color_images')
      .select('id, product_color_id, image_url, display_order');

    if (imagesError) {
      console.warn('Warning fetching product_color_images:', imagesError.message);
    }

    // Maps to resolve front_image URL
    const imageById = new Map<string, string>();
    const fallbackImageByColorId = new Map<string, string>();

    (colorImages || [])
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .forEach((img) => {
        if (img.id && img.image_url) {
          imageById.set(img.id, img.image_url);
        }
        if (img.product_color_id && img.image_url && !fallbackImageByColorId.has(img.product_color_id)) {
          fallbackImageByColorId.set(img.product_color_id, img.image_url);
        }
      });

    // Step 3: Find get mrp and sp from product_variants where product_color_id = step 2 result product_colors.id
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, product_color_id, mrp, s_p, status')
      .in('product_color_id', productColorIds);

    if (variantsError) {
      console.error('Error in Step 3 (fetching product_variants):', variantsError.message);
    }

    const activeVariants = (variants || []).filter((v) => v.status !== 'deactive');

    // Group first available variant price by product_color_id
    const variantPricingByColorId = new Map<string, { mrp: number; s_p: number }>();
    activeVariants.forEach((v) => {
      if (v.product_color_id && !variantPricingByColorId.has(v.product_color_id)) {
        variantPricingByColorId.set(v.product_color_id, {
          mrp: Number(v.mrp) || 0,
          s_p: Number(v.s_p) || 0,
        });
      }
    });

    // Assemble the featured products
    const featuredProducts: FeaturedProduct[] = [];

    for (const prod of activeProducts) {
      const colorsForProduct = activeColors.filter((c) => c.product_id === prod.id);
      if (colorsForProduct.length === 0) continue;

      // Select primary colorway for the product
      const colorway = colorsForProduct[0];

      // Resolve front image URL
      let frontImageUrl: string | null = null;
      if (colorway.front_image && imageById.has(colorway.front_image)) {
        frontImageUrl = imageById.get(colorway.front_image) || null;
      } else if (fallbackImageByColorId.has(colorway.id)) {
        frontImageUrl = fallbackImageByColorId.get(colorway.id) || null;
      }

      // Resolve MRP and SP
      const pricing = variantPricingByColorId.get(colorway.id) || { mrp: 0, s_p: 0 };
      const mrp = pricing.mrp;
      const sp = pricing.s_p;

      // Calculate discount percentage
      const discount = mrp > 0 && mrp > sp ? Math.round(((mrp - sp) / mrp) * 100) : 0;

      featuredProducts.push({
        id: prod.id,
        prod_id: prod.prod_id,
        name: prod.name,
        fit: prod.fit,
        product_color_id: colorway.id,
        front_image_url: frontImageUrl,
        mrp: mrp,
        s_p: sp,
        discount: discount,
      });
    }

    return featuredProducts;
  } catch (err) {
    console.error('Unexpected error in getFeaturedProducts:', err);
    return [];
  }
}
