import { supabase } from './supabase';
import { Category, getCategories } from './categoriesStore';

export interface ProductColorInfo {
  id: string;
  name: string;
  code: string;
}

export interface ProductItem {
  id: string; // products.id
  prod_id?: string;
  name: string;
  fit?: string | null;
  collar?: string | null;
  fabric?: string | null;
  category_id: string;
  category_name?: string;
  product_color_id: string;
  front_image_url: string | null;
  mrp: number;
  s_p: number;
  discount: number;
  best_price: number;
  colors: ProductColorInfo[];
}

export interface GetProductsFilter {
  categoryId?: string | null;
  search?: string | null;
}

export interface ProductColorDetail {
  id: string; // product_colors.id
  color_id: string;
  name: string;
  code: string;
  image_url: string | null;
}

export interface ProductVariantDetail {
  id: string;
  product_id: string;
  product_color_id: string;
  size_id: string;
  size_value: string;
  barcode?: string;
  mrp: number;
  s_p: number;
  quantity: number;
  discount: number;
  best_price: number;
  online_available: boolean;
}

export interface ProductDetail {
  id: string;
  prod_id?: string;
  name: string;
  fit?: string | null;
  collar?: string | null;
  fabric?: string | null;
  category_id: string;
  category_name?: string;
  colors: ProductColorDetail[];
}

export interface ColorImageItem {
  id: string;
  image_url: string;
  display_order: number;
}

/**
 * Fetches products from Supabase with categories, colors, front images, and pricing.
 * Strictly uses real Supabase data only - no dummy/mock data.
 * If there is no data, returns an empty array.
 */
export async function getProducts(filters?: GetProductsFilter): Promise<ProductItem[]> {
  try {
    // 1. Fetch categories to help with name mapping and category matching
    const categories = await getCategories();
    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
      if (cat.cat_id) categoryMap.set(cat.cat_id, cat);
    });

    // Determine target category ID if provided
    let targetCategoryId: string | null = null;
    if (filters?.categoryId && filters.categoryId !== 'all') {
      const trimmed = filters.categoryId.trim();
      if (categoryMap.has(trimmed)) {
        targetCategoryId = categoryMap.get(trimmed)!.id;
      } else {
        const matched = categories.find(
          (c) =>
            c.id.toLowerCase() === trimmed.toLowerCase() ||
            c.name.toLowerCase() === trimmed.toLowerCase() ||
            (c.cat_id && c.cat_id.toLowerCase() === trimmed.toLowerCase())
        );
        if (matched) {
          targetCategoryId = matched.id;
        } else {
          targetCategoryId = trimmed;
        }
      }
    }

    // 2. Fetch base products
    let query = supabase
      .from('products')
      .select('id, prod_id, name, fit, collar, fabric, category_id, status, landing_page')
      .order('created_at', { ascending: false });

    if (targetCategoryId) {
      query = query.eq('category_id', targetCategoryId);
    }

    const { data: productsData, error: prodError } = await query;

    if (prodError) {
      console.error('Error fetching products from Supabase:', prodError.message);
      return [];
    }

    if (!productsData || productsData.length === 0) {
      return [];
    }

    let activeProducts = productsData.filter((p) => p.status !== false);

    // Apply search filter if provided
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim().toLowerCase();
      activeProducts = activeProducts.filter((p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.prod_id && p.prod_id.toLowerCase().includes(searchTerm)) ||
        (p.fit && p.fit.toLowerCase().includes(searchTerm))
      );
    }

    if (activeProducts.length === 0) {
      return [];
    }

    const productIds = activeProducts.map((p) => p.id);

    // 3. Fetch product_colors for these products
    const { data: productColors, error: colorsRelError } = await supabase
      .from('product_colors')
      .select('id, product_id, color_id, front_image, status')
      .in('product_id', productIds);

    if (colorsRelError) {
      console.warn('Warning fetching product_colors:', colorsRelError.message);
    }

    const activeProductColors = (productColors || []).filter((pc) => pc.status !== false);
    const productColorIds = activeProductColors.map((pc) => pc.id);

    // 4. Fetch colors master table
    const { data: masterColors, error: masterColorsError } = await supabase
      .from('colors')
      .select('id, name, code');

    if (masterColorsError) {
      console.warn('Warning fetching colors master:', masterColorsError.message);
    }

    const colorLookup = new Map<string, { id: string; name: string; code: string }>();
    (masterColors || []).forEach((c) => {
      if (c.id) {
        colorLookup.set(c.id, {
          id: c.id,
          name: c.name || 'Default',
          code: c.code || '#0D0D0D',
        });
      }
    });

    // 5. Fetch product_color_images
    const { data: colorImages, error: imagesError } = await supabase
      .from('product_color_images')
      .select('id, product_id, product_color_id, image_url, display_order')
      .in('product_id', productIds);

    if (imagesError) {
      console.warn('Warning fetching product_color_images:', imagesError.message);
    }

    const imageById = new Map<string, string>();
    const fallbackImageByColorId = new Map<string, string>();
    const fallbackImageByProductId = new Map<string, string>();

    (colorImages || [])
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .forEach((img) => {
        if (img.id && img.image_url) {
          imageById.set(img.id, img.image_url);
        }
        if (img.product_color_id && img.image_url && !fallbackImageByColorId.has(img.product_color_id)) {
          fallbackImageByColorId.set(img.product_color_id, img.image_url);
        }
        if (img.product_id && img.image_url && !fallbackImageByProductId.has(img.product_id)) {
          fallbackImageByProductId.set(img.product_id, img.image_url);
        }
      });

    // 6. Fetch product_variants
    let variants: Array<{
      id: string;
      product_id: string;
      product_color_id: string;
      mrp: number;
      s_p: number;
      status: string;
    }> = [];

    if (productColorIds.length > 0) {
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, product_id, product_color_id, mrp, s_p, status')
        .in('product_color_id', productColorIds);

      if (variantsError) {
        console.warn('Warning fetching product_variants:', variantsError.message);
      } else if (variantsData) {
        variants = variantsData;
      }
    } else {
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, product_id, product_color_id, mrp, s_p, status')
        .in('product_id', productIds);

      if (variantsError) {
        console.warn('Warning fetching product_variants by product_id:', variantsError.message);
      } else if (variantsData) {
        variants = variantsData;
      }
    }

    const activeVariants = variants.filter((v) => v.status !== 'deactive');

    // Group pricing by product_color_id and product_id
    const pricingByColorId = new Map<string, { mrp: number; s_p: number }>();
    const pricingByProductId = new Map<string, { mrp: number; s_p: number }>();

    activeVariants.forEach((v) => {
      const mrp = Number(v.mrp) || 0;
      const s_p = Number(v.s_p) || 0;

      if (v.product_color_id && !pricingByColorId.has(v.product_color_id)) {
        pricingByColorId.set(v.product_color_id, { mrp, s_p });
      }

      if (v.product_id && !pricingByProductId.has(v.product_id)) {
        pricingByProductId.set(v.product_id, { mrp, s_p });
      }
    });

    // 7. Assemble final product list
    const results: ProductItem[] = [];

    for (const prod of activeProducts) {
      const colorsForThisProduct = activeProductColors.filter((c) => c.product_id === prod.id);

      const productColorsList: ProductColorInfo[] = [];
      const seenColorIds = new Set<string>();

      colorsForThisProduct.forEach((pc) => {
        if (pc.color_id && !seenColorIds.has(pc.color_id)) {
          seenColorIds.add(pc.color_id);
          const masterColor = colorLookup.get(pc.color_id);
          if (masterColor) {
            productColorsList.push(masterColor);
          }
        }
      });

      const primaryColorway = colorsForThisProduct[0] || null;

      let frontImageUrl: string | null = null;
      if (primaryColorway?.front_image && imageById.has(primaryColorway.front_image)) {
        frontImageUrl = imageById.get(primaryColorway.front_image) || null;
      } else if (primaryColorway && fallbackImageByColorId.has(primaryColorway.id)) {
        frontImageUrl = fallbackImageByColorId.get(primaryColorway.id) || null;
      } else if (fallbackImageByProductId.has(prod.id)) {
        frontImageUrl = fallbackImageByProductId.get(prod.id) || null;
      }

      const pricing =
        (primaryColorway ? pricingByColorId.get(primaryColorway.id) : null) ||
        pricingByProductId.get(prod.id) || { mrp: 0, s_p: 0 };

      const mrp = pricing.mrp;
      const sp = pricing.s_p;
      const discount = mrp > 0 && mrp > sp ? Math.round(((mrp - sp) / mrp) * 100) : 0;
      const bestPrice = sp > 0 ? Math.round(sp * 0.9) : sp;
      const categoryName = categoryMap.get(prod.category_id)?.name || undefined;

      results.push({
        id: prod.id,
        prod_id: prod.prod_id,
        name: prod.name,
        fit: prod.fit,
        collar: prod.collar,
        fabric: prod.fabric,
        category_id: prod.category_id,
        category_name: categoryName,
        product_color_id: primaryColorway ? primaryColorway.id : '',
        front_image_url: frontImageUrl,
        mrp: mrp,
        s_p: sp,
        discount: discount,
        best_price: bestPrice,
        colors: productColorsList,
      });
    }

    return results;
  } catch (err) {
    console.error('Unexpected error in getProducts:', err);
    return [];
  }
}

/**
 * Fetches single product details and all its available color options.
 * Real Supabase query only. Returns null if not found.
 */
export async function getProductById(productId: string): Promise<ProductDetail | null> {
  try {
    const { data: prod, error: prodError } = await supabase
      .from('products')
      .select('id, prod_id, name, fit, collar, fabric, category_id, status')
      .eq('id', productId)
      .single();

    if (prodError || !prod) {
      console.error('Error fetching product by id:', prodError?.message);
      return null;
    }

    // Category name
    const { data: catData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', prod.category_id)
      .maybeSingle();

    // Fetch active product_colors for this product
    const { data: productColors, error: pcError } = await supabase
      .from('product_colors')
      .select('id, product_id, color_id, front_image, status')
      .eq('product_id', prod.id)
      .neq('status', false);

    if (pcError) {
      console.warn('Error fetching product_colors for product:', pcError.message);
    }

    const colorsList: ProductColorDetail[] = [];

    if (productColors && productColors.length > 0) {
      const colorIds = productColors.map((pc) => pc.color_id);
      const { data: masterColors } = await supabase
        .from('colors')
        .select('id, name, code')
        .in('id', colorIds);

      const colorMap = new Map<string, { name: string; code: string }>();
      (masterColors || []).forEach((c) => {
        colorMap.set(c.id, { name: c.name || 'Color', code: c.code || '#0D0D0D' });
      });

      // Fetch images for these colorways to find thumbnail
      const productColorIds = productColors.map((pc) => pc.id);
      const { data: images } = await supabase
        .from('product_color_images')
        .select('id, product_color_id, image_url, display_order')
        .in('product_color_id', productColorIds)
        .order('display_order', { ascending: true });

      const imageById = new Map<string, string>();
      const firstImageByColorId = new Map<string, string>();

      (images || []).forEach((img) => {
        if (img.id && img.image_url) {
          imageById.set(img.id, img.image_url);
        }
        if (img.product_color_id && img.image_url && !firstImageByColorId.has(img.product_color_id)) {
          firstImageByColorId.set(img.product_color_id, img.image_url);
        }
      });

      for (const pc of productColors) {
        const cInfo = colorMap.get(pc.color_id) || { name: 'Color', code: '#0D0D0D' };
        let imgUrl: string | null = null;
        if (pc.front_image && imageById.has(pc.front_image)) {
          imgUrl = imageById.get(pc.front_image) || null;
        } else if (firstImageByColorId.has(pc.id)) {
          imgUrl = firstImageByColorId.get(pc.id) || null;
        }

        colorsList.push({
          id: pc.id,
          color_id: pc.color_id,
          name: cInfo.name,
          code: cInfo.code,
          image_url: imgUrl,
        });
      }
    }

    return {
      id: prod.id,
      prod_id: prod.prod_id,
      name: prod.name,
      fit: prod.fit,
      collar: prod.collar,
      fabric: prod.fabric,
      category_id: prod.category_id,
      category_name: catData?.name || undefined,
      colors: colorsList,
    };
  } catch (err) {
    console.error('Unexpected error in getProductById:', err);
    return null;
  }
}

/**
 * Fetches gallery images for a selected product_color_id from Supabase.
 * Only loaded when a color is selected.
 */
export async function getColorImages(productColorId: string): Promise<ColorImageItem[]> {
  try {
    if (!productColorId) return [];

    const { data, error } = await supabase
      .from('product_color_images')
      .select('id, image_url, display_order')
      .eq('product_color_id', productColorId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching color images from Supabase:', error.message);
      return [];
    }

    return (data as ColorImageItem[]) || [];
  } catch (err) {
    console.error('Unexpected error in getColorImages:', err);
    return [];
  }
}

/**
 * Fetches sizes and prices for a selected product_color_id from product_variants.
 */
export async function getColorVariants(productColorId: string): Promise<ProductVariantDetail[]> {
  try {
    if (!productColorId) return [];

    const { data: variants, error: vError } = await supabase
      .from('product_variants')
      .select('id, product_id, product_color_id, size_id, barcode, mrp, s_p, quantity, status, online_available')
      .eq('product_color_id', productColorId)
      .neq('status', 'deactive')
      .order('created_at', { ascending: true });

    if (vError) {
      console.error('Error fetching variants from Supabase:', vError.message);
      return [];
    }

    if (!variants || variants.length === 0) {
      return [];
    }

    // Fetch size names from sizes table
    const sizeIds = variants.map((v) => v.size_id);
    const { data: sizesData, error: sError } = await supabase
      .from('sizes')
      .select('id, value')
      .in('id', sizeIds);

    if (sError) {
      console.warn('Warning fetching sizes from Supabase:', sError.message);
    }

    const sizeMap = new Map<string, string>();
    (sizesData || []).forEach((s) => {
      sizeMap.set(s.id, s.value);
    });

    return variants.map((v) => {
      const mrp = Number(v.mrp) || 0;
      const sp = Number(v.s_p) || 0;
      const discount = mrp > 0 && mrp > sp ? Math.round(((mrp - sp) / mrp) * 100) : 0;
      const bestPrice = sp > 0 ? Math.round(sp * 0.9) : sp;
      const sizeVal = sizeMap.get(v.size_id) || 'Standard';

      return {
        id: v.id,
        product_id: v.product_id,
        product_color_id: v.product_color_id,
        size_id: v.size_id,
        size_value: sizeVal,
        barcode: v.barcode,
        mrp: mrp,
        s_p: sp,
        quantity: Number(v.quantity) || 0,
        discount: discount,
        best_price: bestPrice,
        online_available: v.online_available !== false,
      };
    });
  } catch (err) {
    console.error('Unexpected error in getColorVariants:', err);
    return [];
  }
}
