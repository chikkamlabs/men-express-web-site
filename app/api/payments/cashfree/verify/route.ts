import { NextRequest, NextResponse } from 'next/server';
import { cashfree, CashfreePaymentEntity } from '@/lib/cashfree';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();

    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid order_id string is required.' },
        { status: 400 }
      );
    }

    const cleanOrderId = order_id.trim();
    const supabaseAdmin = getSupabaseServerClient();

    // 1. Fetch current order from Supabase
    const { data: orderRecord, error: orderFetchError } = await supabaseAdmin
      .from('online_orders')
      .select(`
        id,
        order_id,
        amount,
        payable_amount,
        payment,
        status,
        customer_id,
        customers (
          id,
          name,
          mobile,
          email,
          key
        )
      `)
      .eq('order_id', cleanOrderId)
      .single();

    if (orderFetchError || !orderRecord) {
      throw new Error(
        `Order record "${cleanOrderId}" could not be found in online_orders: ${orderFetchError?.message || 'Record missing'}`
      );
    }

    // 2. Fetch order status directly from Cashfree
    const cashfreeOrder = await cashfree.getOrder(cleanOrderId);
    if (!cashfreeOrder) {
      throw new Error(`Cashfree order details for "${cleanOrderId}" could not be retrieved.`);
    }

    // 3. Fetch payment attempts from Cashfree
    let payments: CashfreePaymentEntity[] = [];
    try {
      payments = await cashfree.getOrderPayments(cleanOrderId);
    } catch (err) {
      console.warn(`Could not fetch payments list for ${cleanOrderId}:`, err);
    }

    const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS');
    const isPaid = cashfreeOrder.order_status === 'PAID' || Boolean(successfulPayment);

    const latestPayment = successfulPayment || payments[0];
    const customerInfo = Array.isArray(orderRecord.customers)
      ? orderRecord.customers[0]
      : orderRecord.customers;

    if (isPaid) {
      const cfPaymentId = latestPayment?.cf_payment_id
        ? String(latestPayment.cf_payment_id)
        : cashfreeOrder.cf_order_id;
      const transactionId = latestPayment?.bank_reference || cfPaymentId;
      const paidAtTime = latestPayment?.payment_time
        ? new Date(latestPayment.payment_time).toISOString()
        : new Date().toISOString();

      // Update order_payments table with elevated service role key
      const { error: paymentUpdateError } = await supabaseAdmin
        .from('order_payments')
        .update({
          cf_order_id: cashfreeOrder.cf_order_id,
          cf_payment_id: cfPaymentId,
          transaction_id: transactionId,
          amount: cashfreeOrder.order_amount,
          currency: cashfreeOrder.order_currency || 'INR',
          status: 'completed',
          paid_at: paidAtTime,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderRecord.id);

      if (paymentUpdateError) {
        throw new Error(`Failed to update order_payments record: ${paymentUpdateError.message}`);
      }

      // Update online_orders table with elevated service role key
      const transactionDetails = `Paid via Cashfree PG | CF Order: ${cashfreeOrder.cf_order_id} | Payment ID: ${cfPaymentId} | Ref: ${transactionId} | Amount: ₹${cashfreeOrder.order_amount}`;

      const { error: orderUpdateError } = await supabaseAdmin
        .from('online_orders')
        .update({
          payment: 'verified',
          status: 'payment_success',
          transaction_details: transactionDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderRecord.id);

      if (orderUpdateError) {
        throw new Error(`Failed to update online_orders record: ${orderUpdateError.message}`);
      }

      return NextResponse.json({
        success: true,
        is_paid: true,
        order_status: cashfreeOrder.order_status,
        order_id: orderRecord.order_id,
        customer_key: customerInfo?.key || '',
        payment: {
          cf_order_id: cashfreeOrder.cf_order_id,
          cf_payment_id: cfPaymentId,
          transaction_id: transactionId,
          amount: cashfreeOrder.order_amount,
          currency: cashfreeOrder.order_currency,
          paid_at: paidAtTime,
        },
      });
    }

    // Payment not successful yet (cancelled, failed, or pending)
    const isFailedOrCancelled =
      cashfreeOrder.order_status === 'EXPIRED' ||
      cashfreeOrder.order_status === 'TERMINATED' ||
      latestPayment?.payment_status === 'FAILED' ||
      latestPayment?.payment_status === 'USER_DROPPED' ||
      latestPayment?.payment_status === 'CANCELLED';

    if (isFailedOrCancelled) {
      const failureReason =
        latestPayment?.payment_message ||
        `Payment ${latestPayment?.payment_status || cashfreeOrder.order_status}`;

      // Update order_payments
      const { error: paymentUpdateError } = await supabaseAdmin
        .from('order_payments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderRecord.id);

      if (paymentUpdateError) {
        throw new Error(`Failed to update order_payments to cancelled: ${paymentUpdateError.message}`);
      }

      // Update online_orders
      const { error: orderUpdateError } = await supabaseAdmin
        .from('online_orders')
        .update({
          payment: 'rejected',
          status: 'cancelled',
          transaction_details: `Payment Unsuccessful: ${failureReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderRecord.id);

      if (orderUpdateError) {
        throw new Error(`Failed to update online_orders to cancelled: ${orderUpdateError.message}`);
      }

      return NextResponse.json({
        success: true,
        is_paid: false,
        order_status: cashfreeOrder.order_status,
        payment_status: latestPayment?.payment_status || 'FAILED',
        reason: failureReason,
        order_id: orderRecord.order_id,
      });
    }

    // Payment still pending / in progress
    return NextResponse.json({
      success: true,
      is_paid: false,
      order_status: cashfreeOrder.order_status,
      payment_status: latestPayment?.payment_status || 'PENDING',
      order_id: orderRecord.order_id,
    });
  } catch (error) {
    console.error('Error in Cashfree verify route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during payment verification.',
      },
      { status: 500 }
    );
  }
}
