import { NextRequest, NextResponse } from 'next/server';
import { cashfree } from '@/lib/cashfree';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabaseAdmin = getSupabaseServerClient();

    let orderUuid: string;
    let orderHumanId: string;
    let payableAmount: number;
    let customerPhone: string;
    let customerName: string;
    let customerEmail: string;
    let customerId: string;
    let customerKey: string = '';

    // If client supplied full checkout details, create customer, address, online_orders and order_items
    if (body.customer && body.items && body.items.length > 0) {
      const cleanMobile = body.customer.mobile?.trim().replace(/\D/g, '').slice(-10);
      if (!cleanMobile || cleanMobile.length < 10) {
        return NextResponse.json(
          { success: false, error: 'A valid 10-digit mobile number is required.' },
          { status: 400 }
        );
      }

      customerPhone = cleanMobile;
      customerName = `${body.customer.firstName || ''} ${body.customer.lastName || ''}`.trim() || 'Customer';
      customerEmail = body.customer.email?.trim() || `${cleanMobile}@menexpress.in`;

      payableAmount = Number(body.payableAmount);
      if (isNaN(payableAmount) || payableAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Payable amount must be greater than 0.' },
          { status: 400 }
        );
      }

      // 1. Upsert customer
      const { data: existingCustomer, error: custFetchError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .or(`mobile.eq.${cleanMobile},mobile.ilike.%${cleanMobile}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (custFetchError) {
        throw new Error(`Failed to query customer database: ${custFetchError.message}`);
      }

      let activeCustomer = existingCustomer;

      if (!activeCustomer) {
        const { data: newCustomer, error: custInsertError } = await supabaseAdmin
          .from('customers')
          .insert({
            name: customerName,
            mobile: cleanMobile,
            email: customerEmail,
          })
          .select('*')
          .single();

        if (custInsertError || !newCustomer) {
          throw new Error(`Failed to create customer: ${custInsertError?.message || 'Unknown database error'}`);
        }
        activeCustomer = newCustomer;
      } else if (customerName && customerName !== activeCustomer.name) {
        const { error: custUpdateError } = await supabaseAdmin
          .from('customers')
          .update({ name: customerName, email: customerEmail })
          .eq('id', activeCustomer.id);

        if (custUpdateError) {
          throw new Error(`Failed to update customer: ${custUpdateError.message}`);
        }
      }

      customerId = activeCustomer.id;
      customerKey = activeCustomer.key || '';

      // 2. Save customer address
      if (body.address) {
        const { error: addressError } = await supabaseAdmin
          .from('customer_address')
          .insert({
            customer_id: customerId,
            address_name: 'Home',
            address: body.address.houseStreet?.trim() || 'Address Not Provided',
            city: body.address.city?.trim() || '',
            state: body.address.state?.trim() || '',
            postal_code: body.address.postalCode?.trim() || '',
            land_mark: body.address.landmark?.trim() || null,
            email: customerEmail,
            status: 'active',
          });

        if (addressError) {
          throw new Error(`Failed to save delivery address: ${addressError.message}`);
        }
      }

      // 3. Generate human order ID
      const timestampStr = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      orderHumanId = `ME-${timestampStr}-${randomSuffix}`;

      const deliverySummary = body.address
        ? `${body.address.houseStreet}, ${body.address.city}, ${body.address.state} - ${body.address.postalCode}`
        : '';

      const discount = Math.max(0, Number(body.discount) || 0);
      const deliveryCharges = Math.max(0, Number(body.deliveryCharges) || 0);
      const subtotal = Math.max(0, Number(body.amount) || payableAmount);
      const cleanCoupon = body.couponCode?.trim() || null;

      // 4. Insert into online_orders table
      const { data: orderRecord, error: orderInsertError } = await supabaseAdmin
        .from('online_orders')
        .insert({
          order_id: orderHumanId,
          customer_id: customerId,
          amount: subtotal,
          discount: discount,
          delivery_charges: deliveryCharges,
          payable_amount: payableAmount,
          coupon_code: cleanCoupon,
          payment: 'pending',
          status: 'pending',
          transaction_details: `Cashfree gateway initiated for ${customerName} | Phone: ${cleanMobile} | Address: ${deliverySummary}`,
        })
        .select('id, order_id')
        .single();

      if (orderInsertError || !orderRecord) {
        throw new Error(`Failed to insert online order record: ${orderInsertError?.message || 'Unknown database error'}`);
      }

      orderUuid = orderRecord.id;

      // 5. Insert order_items
      const orderItemsRows = body.items.map((item: {
        variantId: string;
        quantity: number;
        s_p: number;
      }) => ({
        order_id: orderUuid,
        prod_id: item.variantId,
        quantity: item.quantity,
        s_p: item.s_p,
        row_total: item.s_p * item.quantity,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsRows);

      if (itemsError) {
        throw new Error(`Failed to insert order line items: ${itemsError.message}`);
      }
    } else if (body.orderId) {
      // Existing order lookup
      const { data: existingOrder, error: fetchOrderError } = await supabaseAdmin
        .from('online_orders')
        .select(`
          id,
          order_id,
          payable_amount,
          customers (
            id,
            name,
            mobile,
            email,
            key
          )
        `)
        .eq('order_id', body.orderId)
        .single();

      if (fetchOrderError || !existingOrder) {
        throw new Error(`Order ${body.orderId} not found in database: ${fetchOrderError?.message || 'No record'}`);
      }

      const cust = Array.isArray(existingOrder.customers)
        ? existingOrder.customers[0]
        : existingOrder.customers;

      if (!cust) {
        throw new Error(`Associated customer record for order ${body.orderId} not found.`);
      }

      orderUuid = existingOrder.id;
      orderHumanId = existingOrder.order_id;
      payableAmount = Number(existingOrder.payable_amount);
      customerId = cust.id;
      customerName = cust.name || 'Customer';
      customerPhone = cust.mobile?.replace(/\D/g, '').slice(-10) || '9999999999';
      customerEmail = cust.email || `${customerPhone}@menexpress.in`;
      customerKey = cust.key || '';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request: Must provide customer details and items, or existing orderId.' },
        { status: 400 }
      );
    }

    // 6. Create Cashfree Order
    const origin =
      req.headers.get('origin') ||
      req.headers.get('referer') ||
      process.env.APP_URL ||
      'http://localhost:3000';

    const cleanOrigin = origin.replace(/\/$/, '');
    const returnUrl = `${cleanOrigin}/cashfree/success?order_id=${encodeURIComponent(orderHumanId)}`;
    const notifyUrl = `${cleanOrigin}/api/payments/cashfree/webhook`;

    const cashfreeRes = await cashfree.createOrder({
      order_id: orderHumanId,
      order_amount: payableAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId.replace(/[^a-zA-Z0-9_-]/g, '_'),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_note: `MEN EXPRESS Order ${orderHumanId}`,
    });

    if (!cashfreeRes || !cashfreeRes.payment_session_id) {
      throw new Error('Cashfree did not return a valid payment_session_id.');
    }

    // 7. Insert or update in order_payments table
    const { error: paymentInsertError } = await supabaseAdmin
      .from('order_payments')
      .upsert({
        order_id: orderUuid,
        payment_gateway: 'cashfree',
        cf_order_id: cashfreeRes.cf_order_id,
        payment_session_id: cashfreeRes.payment_session_id,
        amount: payableAmount,
        currency: 'INR',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cf_order_id' });

    if (paymentInsertError) {
      throw new Error(`Failed to record order payment entry: ${paymentInsertError.message}`);
    }

    return NextResponse.json({
      success: true,
      payment_session_id: cashfreeRes.payment_session_id,
      order_id: orderHumanId,
      order_uuid: orderUuid,
      customer_key: customerKey,
      cf_order_id: cashfreeRes.cf_order_id,
      environment: cashfree.getEnvironment().toLowerCase(),
    });
  } catch (error) {
    console.error('Error in Cashfree create_order route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during payment initiation.',
      },
      { status: 500 }
    );
  }
}
