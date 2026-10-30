import { supabase } from './supabase';

export interface CouponCode {
  id: string;
  code: string;
  discount: number;
  sentence: string | null;
  usage: number;
  threshold: number;
  valid_upto: string | null;
  status: boolean;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all active and public coupons from coupon_codes table
 * Only fetches real content from Supabase, returns empty array if none found
 */
export async function getPublicCoupons(): Promise<CouponCode[]> {
  try {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('status', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public coupons from supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    return data.filter((c: CouponCode) => {
      if (!c.valid_upto) return true;
      return c.valid_upto >= today;
    });
  } catch (err) {
    console.error('Exception fetching public coupons:', err);
    return [];
  }
}

/**
 * Validate a coupon code according to requirements:
 * 1. Matches code in coupon_codes table
 * 2. status must be active (true)
 * 3. valid_upto must be today or in the future
 * 4. threshold check: if threshold > 0, itemsSubtotal >= threshold (if 0, no limit)
 * 5. discount must be less than estimatedTotal (discount < estimatedTotal)
 */
export async function validateCoupon(
  code: string,
  itemsSubtotal: number = 0,
  estimatedTotal?: number
): Promise<{ valid: boolean; coupon?: CouponCode; discount?: number; error?: string }> {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: 'Please enter a coupon code.' };
    }

    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: 'Coupon code does not exist.' };
    }

    // Check status (should be active)
    if (!data.status) {
      return { valid: false, error: 'This coupon is currently inactive.' };
    }

    // Check valid_upto
    const today = new Date().toISOString().split('T')[0];
    if (data.valid_upto && data.valid_upto < today) {
      return { valid: false, error: `Coupon expired on ${data.valid_upto}.` };
    }

    // Check threshold (if 0 No limit)
    const thresholdVal = Number(data.threshold) || 0;
    if (thresholdVal > 0 && itemsSubtotal < thresholdVal) {
      return {
        valid: false,
        error: `Order subtotal must be at least ₹${thresholdVal.toLocaleString('en-IN')} to apply this coupon.`,
      };
    }

    const discountVal = Number(data.discount) || 0;

    // Check should discount < Estimated total
    if (estimatedTotal !== undefined && estimatedTotal > 0) {
      if (discountVal >= estimatedTotal) {
        return {
          valid: false,
          error: `Coupon discount (₹${discountVal}) must be less than estimated total (₹${estimatedTotal}).`,
        };
      }
    }

    return { valid: true, coupon: data, discount: discountVal };
  } catch (err) {
    console.error('Error validating coupon:', err);
    return { valid: false, error: 'Failed to validate coupon code.' };
  }
}

/**
 * Increment usage count on a coupon after an order is placed
 */
export async function incrementCouponUsage(idOrCode: string): Promise<void> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const query = isUuid
      ? supabase.from('coupon_codes').select('id, usage').eq('id', idOrCode)
      : supabase.from('coupon_codes').select('id, usage').ilike('code', idOrCode.trim());

    const { data } = await query.maybeSingle();

    if (data && data.id) {
      await supabase
        .from('coupon_codes')
        .update({
          usage: (data.usage || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);
    }
  } catch (err) {
    console.error('Error incrementing coupon usage:', err);
  }
}
