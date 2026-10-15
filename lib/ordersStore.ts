import { supabase } from './supabase';
import { CartItem } from './cartStore';

export interface CustomerData {
  id?: string;
  name: string;
  mobile: string;
  email?: string | null;
  key?: string;
  points?: number;
}

export interface CustomerAddressData {
  id?: string;
  customer_id?: string;
  address_name?: string | null;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  land_mark?: string | null;
  mobile_alt?: string | null;
  email?: string | null;
  status?: string;
}

export interface PlaceOrderInput {
  customer: {
    firstName: string;
    lastName?: string;
    mobile: string;
    email?: string;
  };
  address: {
    houseStreet: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
  };
  items: CartItem[];
  amount: number;
  deliveryCharges: number;
  payableAmount: number;
}

export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  customerKey?: string;
  whatsappUrl?: string;
  error?: string;
}

/**
 * Searches for an existing customer in the Supabase customers table by mobile number.
 */
export async function getCustomerByMobile(mobile: string): Promise<CustomerData | null> {
  try {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile) return null;

    // Search with 10 digits or exact match
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`mobile.eq.${cleanMobile},mobile.ilike.%${cleanMobile}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching customer by mobile from Supabase:', error.message);
      return null;
    }

    return (data as CustomerData) || null;
  } catch (err) {
    console.error('Unexpected error in getCustomerByMobile:', err);
    return null;
  }
}

/**
 * Fetches the active saved delivery address for a customer from Supabase customer_address table.
 */
export async function getCustomerAddress(customerId: string): Promise<CustomerAddressData | null> {
  try {
    if (!customerId) return null;

    const { data, error } = await supabase
      .from('customer_address')
      .select('*')
      .eq('customer_id', customerId)
      .neq('status', 'deactive')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching customer address from Supabase:', error.message);
      return null;
    }

    return (data as CustomerAddressData) || null;
  } catch (err) {
    console.error('Unexpected error in getCustomerAddress:', err);
    return null;
  }
}

/**
 * Creates or updates a customer profile in Supabase.
 */
export async function upsertCustomer(input: {
  name: string;
  mobile: string;
  email?: string | null;
}): Promise<CustomerData> {
  const cleanMobile = input.mobile.trim().replace(/\D/g, '').slice(-10);

  // Check if exists
  const existing = await getCustomerByMobile(cleanMobile);
  if (existing && existing.id) {
    // Optionally update name if modified
    if (input.name && input.name !== existing.name) {
      await supabase
        .from('customers')
        .update({ name: input.name, email: input.email || existing.email })
        .eq('id', existing.id);
    }
    return { ...existing, name: input.name, email: input.email || existing.email };
  }

  // Insert new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: input.name.trim(),
      mobile: cleanMobile,
      email: input.email?.trim() || null,
    })
    .select('*')
    .single();

  if (error || !newCustomer) {
    throw new Error(error?.message || 'Failed to create customer record');
  }

  return newCustomer as CustomerData;
}

/**
 * Saves or updates a customer address in Supabase customer_address table.
 */
export async function saveCustomerAddress(
  customerId: string,
  addr: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    land_mark?: string | null;
    email?: string | null;
  }
): Promise<CustomerAddressData> {
  const { data, error } = await supabase
    .from('customer_address')
    .insert({
      customer_id: customerId,
      address_name: 'Home',
      address: addr.address.trim(),
      city: addr.city.trim(),
      state: addr.state.trim(),
      postal_code: addr.postal_code.trim(),
      land_mark: addr.land_mark?.trim() || null,
      email: addr.email?.trim() || null,
      status: 'active',
    })
    .select('*')
    .single();

  if (error || !data) {
    console.warn('Warning saving customer address:', error?.message);
    return {
      customer_id: customerId,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      land_mark: addr.land_mark,
    };
  }

  return data as CustomerAddressData;
}

/**
 * Places an online order:
 * 1. Upserts customer & saves address
 * 2. Inserts into online_orders table
 * 3. ONLY if online_orders insertion is successful, inserts line items into order_items table
 * 4. Generates WhatsApp confirmation redirect for +91 9912999344
 */
export async function placeOnlineOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    const fullName = `${input.customer.firstName.trim()} ${input.customer.lastName?.trim() || ''}`.trim();
    const cleanMobile = input.customer.mobile.trim().replace(/\D/g, '').slice(-10);

    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // 1. Ensure customer exists
    const customer = await upsertCustomer({
      name: fullName,
      mobile: cleanMobile,
      email: input.customer.email,
    });

    if (!customer.id) {
      return { success: false, error: 'Unable to register customer in database.' };
    }

    // 2. Save address
    await saveCustomerAddress(customer.id, {
      address: input.address.houseStreet,
      city: input.address.city,
      state: input.address.state,
      postal_code: input.address.postalCode,
      land_mark: input.address.landmark,
      email: input.customer.email,
    });

    // 3. Generate human-readable order id
    const timestampStr = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ME-${timestampStr}-${randomSuffix}`;

    const deliveryAddressSummary = `${input.address.houseStreet}, ${input.address.city}, ${input.address.state} - ${input.address.postalCode}${
      input.address.landmark ? ` (Landmark: ${input.address.landmark})` : ''
    }`;

    // 4. Insert into online_orders
    const { data: orderRecord, error: orderError } = await supabase
      .from('online_orders')
      .insert({
        order_id: orderId,
        customer_id: customer.id,
        amount: input.amount,
        discount: 0.0,
        delivery_charges: input.deliveryCharges,
        payable_amount: input.payableAmount,
        payment: 'pending',
        status: 'pending',
        transaction_details: `Deliver to: ${fullName} | Phone: ${cleanMobile} | Address: ${deliveryAddressSummary}`,
      })
      .select('id, order_id')
      .single();

    if (orderError || !orderRecord) {
      console.error('Failed to insert online_orders:', orderError);
      return {
        success: false,
        error: orderError?.message || 'Could not create order. Please try again.',
      };
    }

    // 5. IF online_orders insertion success THEN ONLY insert into order_items
    const orderItemsRows = input.items.map((item) => ({
      order_id: orderRecord.id, // foreign key to public.online_orders(id)
      prod_id: item.variantId, // foreign key to public.product_variants(id)
      quantity: item.quantity,
      s_p: item.s_p,
      row_total: item.s_p * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsRows);

    if (itemsError) {
      console.error('Warning inserting order_items:', itemsError);
      // We still have the order record created
    }

    // 6. Generate WhatsApp redirect message for target number 9912999344
    const itemLines = input.items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.productName} (${i.colorName}, Size: ${i.sizeValue}) x ${i.quantity} = ₹${(
            i.s_p * i.quantity
          ).toLocaleString('en-IN')}`
      )
      .join('\n');

    const customerKey = customer.key || 'MEKEY';

    const whatsappMessage = `*NEW ORDER - MEN EXPRESS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Order ID:* ${orderRecord.order_id}\n` +
      `*Profile Key:* ${customerKey}\n` +
      `*Customer:* ${fullName}\n` +
      `*Phone:* +91 ${cleanMobile}\n` +
      `\n*Items Ordered:*\n${itemLines}\n\n` +
      `*Subtotal:* ₹${input.amount.toLocaleString('en-IN')}\n` +
      `*Delivery Charges:* ₹${input.deliveryCharges.toLocaleString('en-IN')}\n` +
      `*Total Payable:* ₹${input.payableAmount.toLocaleString('en-IN')}\n` +
      `\n*Delivery Address:*\n${deliveryAddressSummary}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Save your Order ID and Profile Key to track your order online!*`;

    const targetPhone = '919912999344';
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    return {
      success: true,
      orderId: orderRecord.order_id,
      customerKey: customerKey,
      whatsappUrl,
    };
  } catch (err) {
    console.error('Unexpected error in placeOnlineOrder:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred while placing the order.',
    };
  }
}
