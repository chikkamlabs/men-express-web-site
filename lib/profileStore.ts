import { supabase } from './supabase';
import { CustomerData, CustomerAddressData } from './ordersStore';

export type OrderFulfillmentStatus =
  | 'pending'
  | 'payment_success'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export type OrderPaymentStatus =
  | 'pending'
  | 'submitted'
  | 'verified'
  | 'rejected';

export interface OrderItemDetail {
  id: string;
  prod_id: string; // product_variant id
  productName: string;
  sizeValue: string;
  colorName: string;
  imageUrl: string | null;
  quantity: number;
  s_p: number;
  row_total: number;
}

export interface OrderWithDetails {
  id: string; // online_orders uuid
  order_id: string;
  customer_id: string;
  created_at: string;
  amount: number;
  discount: number;
  delivery_charges: number;
  payable_amount: number;
  payment: OrderPaymentStatus | string;
  status: OrderFulfillmentStatus | string;
  transaction_details?: string | null;
  customer: {
    name: string;
    mobile: string;
    email?: string | null;
    key?: string;
  };
  items: OrderItemDetail[];
}

export interface CustomerProfileSummary {
  customer: CustomerData;
  address: CustomerAddressData | null;
  orders: OrderWithDetails[];
}

/**
 * Helper to enrich order items with product name, size, color and image
 */
async function enrichOrderItems(orderId: string): Promise<OrderItemDetail[]> {
  try {
    const { data: rawItems, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error || !rawItems || rawItems.length === 0) {
      return [];
    }

    const variantIds = rawItems.map((i) => i.prod_id);

    // Fetch product_variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, product_color_id, size_id, s_p')
      .in('id', variantIds);

    const variantMap = new Map<string, any>();
    (variants || []).forEach((v) => variantMap.set(v.id, v));

    // Fetch related products
    const productIds = Array.from(new Set((variants || []).map((v) => v.product_id)));
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);
    const prodMap = new Map<string, string>();
    (products || []).forEach((p) => prodMap.set(p.id, p.name));

    // Fetch related sizes
    const sizeIds = Array.from(new Set((variants || []).map((v) => v.size_id)));
    const { data: sizes } = await supabase
      .from('sizes')
      .select('id, value')
      .in('id', sizeIds);
    const sizeMap = new Map<string, string>();
    (sizes || []).forEach((s) => sizeMap.set(s.id, s.value));

    // Fetch related product_colors & colors
    const productColorIds = Array.from(new Set((variants || []).map((v) => v.product_color_id)));
    const { data: prodColors } = await supabase
      .from('product_colors')
      .select('id, color_id, front_image')
      .in('id', productColorIds);

    const colorIdMap = new Map<string, string>();
    (prodColors || []).forEach((pc) => colorIdMap.set(pc.id, pc.color_id));

    const colorMasterIds = Array.from(new Set((prodColors || []).map((pc) => pc.color_id)));
    const { data: colors } = await supabase
      .from('colors')
      .select('id, name')
      .in('id', colorMasterIds);
    const colorNameMap = new Map<string, string>();
    (colors || []).forEach((c) => colorNameMap.set(c.id, c.name));

    // Fetch images
    const { data: images } = await supabase
      .from('product_color_images')
      .select('id, product_color_id, image_url')
      .in('product_color_id', productColorIds);
    const imageMap = new Map<string, string>();
    (images || []).forEach((img) => {
      if (!imageMap.has(img.product_color_id)) {
        imageMap.set(img.product_color_id, img.image_url);
      }
    });

    return rawItems.map((item) => {
      const variant = variantMap.get(item.prod_id);
      const prodName = variant ? prodMap.get(variant.product_id) || 'Apparel Item' : 'Apparel Item';
      const sizeVal = variant ? sizeMap.get(variant.size_id) || 'Standard' : 'Standard';
      const colorId = variant ? colorIdMap.get(variant.product_color_id) : null;
      const colorName = colorId ? colorNameMap.get(colorId) || 'Standard' : 'Standard';
      const imgUrl = variant ? imageMap.get(variant.product_color_id) || null : null;

      return {
        id: item.id,
        prod_id: item.prod_id,
        productName: prodName,
        sizeValue: sizeVal,
        colorName: colorName,
        imageUrl: imgUrl,
        quantity: Number(item.quantity) || 1,
        s_p: Number(item.s_p) || 0,
        row_total: Number(item.row_total) || 0,
      };
    });
  } catch (err) {
    console.error('Error enriching order items:', err);
    return [];
  }
}

/**
 * Tracks an order using Order ID and Profile Key.
 * Verifies that the order exists and that customers.key matches the provided key.
 */
export async function trackOrderByOrderIdAndKey(
  orderIdInput: string,
  profileKeyInput: string
): Promise<{ success: boolean; order?: OrderWithDetails; error?: string }> {
  try {
    const cleanOrderId = orderIdInput.trim();
    const cleanKey = profileKeyInput.trim();

    if (!cleanOrderId) {
      return { success: false, error: 'Please enter a valid Order ID.' };
    }
    if (!cleanKey) {
      return { success: false, error: 'Please enter your Profile Key.' };
    }

    // 1. Fetch order by order_id (exact or prefix/suffix ilike)
    const { data: order, error: orderError } = await supabase
      .from('online_orders')
      .select('*')
      .or(`order_id.ilike.${cleanOrderId},order_id.ilike.%${cleanOrderId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError || !order) {
      return { success: false, error: 'No order found with the provided Order ID.' };
    }

    // 2. Fetch associated customer
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .maybeSingle();

    if (custError || !customer) {
      return { success: false, error: 'Could not retrieve customer details for this order.' };
    }

    // 3. Verify customer profile key matches
    if (
      !customer.key ||
      customer.key.toLowerCase().trim() !== cleanKey.toLowerCase().trim()
    ) {
      return {
        success: false,
        error: 'Profile Key does not match the customer on this order. Please verify the key sent on WhatsApp.',
      };
    }

    // 4. Enrich order line items
    const items = await enrichOrderItems(order.id);

    const fullOrder: OrderWithDetails = {
      id: order.id,
      order_id: order.order_id,
      customer_id: order.customer_id,
      created_at: order.created_at,
      amount: Number(order.amount) || 0,
      discount: Number(order.discount) || 0,
      delivery_charges: Number(order.delivery_charges) || 0,
      payable_amount: Number(order.payable_amount) || 0,
      payment: order.payment || 'pending',
      status: (order.status as OrderFulfillmentStatus) || 'pending',
      transaction_details: order.transaction_details,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        key: customer.key,
      },
      items,
    };

    return { success: true, order: fullOrder };
  } catch (err) {
    console.error('Error tracking order:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while looking up the order.',
    };
  }
}

/**
 * Customer Login using Mobile Number and Profile Key.
 * Checks customers table for matching mobile and key, then loads profile, address, and orders.
 */
export async function loginCustomerByMobileAndKey(
  mobileInput: string,
  profileKeyInput: string
): Promise<{ success: boolean; data?: CustomerProfileSummary; error?: string }> {
  try {
    const cleanMobile = mobileInput.trim().replace(/\D/g, '').slice(-10);
    const cleanKey = profileKeyInput.trim();

    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!cleanKey) {
      return { success: false, error: 'Please enter your Profile Key.' };
    }

    // 1. Fetch customer
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .or(`mobile.eq.${cleanMobile},mobile.ilike.%${cleanMobile}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (custError || !customer) {
      return { success: false, error: 'No customer found with this mobile number.' };
    }

    // 2. Validate key
    if (
      !customer.key ||
      customer.key.toLowerCase().trim() !== cleanKey.toLowerCase().trim()
    ) {
      return {
        success: false,
        error: 'Invalid Profile Key for this mobile number. Please check the key received on WhatsApp.',
      };
    }

    // 3. Fetch active customer address
    const { data: address } = await supabase
      .from('customer_address')
      .select('*')
      .eq('customer_id', customer.id)
      .neq('status', 'deactive')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Fetch orders for this customer
    const { data: ordersData } = await supabase
      .from('online_orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    const enrichedOrders: OrderWithDetails[] = [];
    for (const ord of ordersData || []) {
      const items = await enrichOrderItems(ord.id);
      enrichedOrders.push({
        id: ord.id,
        order_id: ord.order_id,
        customer_id: ord.customer_id,
        created_at: ord.created_at,
        amount: Number(ord.amount) || 0,
        discount: Number(ord.discount) || 0,
        delivery_charges: Number(ord.delivery_charges) || 0,
        payable_amount: Number(ord.payable_amount) || 0,
        payment: ord.payment || 'pending',
        status: (ord.status as OrderFulfillmentStatus) || 'pending',
        transaction_details: ord.transaction_details,
        customer: {
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
          key: customer.key,
        },
        items,
      });
    }

    return {
      success: true,
      data: {
        customer: customer as CustomerData,
        address: (address as CustomerAddressData) || null,
        orders: enrichedOrders,
      },
    };
  } catch (err) {
    console.error('Error logging in customer:', err);
    return {
      success: false,
      error: 'An unexpected error occurred during login.',
    };
  }
}
