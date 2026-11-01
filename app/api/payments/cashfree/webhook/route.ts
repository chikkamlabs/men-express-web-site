import { NextRequest, NextResponse } from 'next/server';
import { cashfree } from '@/lib/cashfree';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    // If Cashfree secret key is configured, verify signature
    if (cashfree.isConfigured() && signature && timestamp) {
      const isValid = cashfree.verifyWebhookSignature({
        signature,
        rawBody,
        timestamp,
      });

      if (!isValid) {
        console.error('Cashfree Webhook signature validation failed.');
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Empty webhook payload' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const orderData = payload?.data?.order || payload?.order;
    const paymentData = payload?.data?.payment || payload?.payment;
    const eventType = payload?.type || payload?.event;

    const orderId = orderData?.order_id || payload?.order_id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Webhook payload missing order_id' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();

    // 1. Fetch matching online_order record
    const { data: orderRecord, error: orderFetchError } = await supabaseAdmin
      .from('online_orders')
      .select('id, order_id, amount, payable_amount')
      .eq('order_id', orderId)
      .single();

    if (orderFetchError || !orderRecord) {
      throw new Error(
        `Webhook: online_order with id "${orderId}" not found in database: ${orderFetchError?.message || 'Missing record'}`
      );
    }

    const paymentStatus = paymentData?.payment_status?.toUpperCase();
    const isSuccess =
      paymentStatus === 'SUCCESS' ||
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID';

    if (isSuccess) {
      const cfPaymentId = paymentData?.cf_payment_id ? String(paymentData.cf_payment_id) : 'UNKNOWN';
      const bankRef = paymentData?.bank_reference || cfPaymentId;
      const paidTime = paymentData?.payment_time
        ? new Date(paymentData.payment_time).toISOString()
        : new Date().toISOString();
      const amount = Number(paymentData?.payment_amount || orderData?.order_amount || orderRecord.payable_amount);

      // 2. Update order_payments
      const { error: paymentUpdateError } = await supabaseAdmin
        .from('order_payments')
        .update({
          cf_payment_id: cfPaymentId,
          transaction_id: bankRef,
          amount,
          currency: paymentData?.payment_currency || 'INR',
          status: 'completed',
          paid_at: paidTime,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderRecord.id);

      if (paymentUpdateError) {
        throw new Error(`Webhook failed to update order_payments: ${paymentUpdateError.message}`);
      }

      // 3. Update online_orders
      const transactionDetails = `Paid via Cashfree PG (Webhook) | CF Payment ID: ${cfPaymentId} | Ref: ${bankRef} | Amount: ₹${amount}`;

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
        throw new Error(`Webhook failed to update online_orders: ${orderUpdateError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Payment successfully verified and recorded.' });
    }

    const isFailure =
      paymentStatus === 'FAILED' ||
      paymentStatus === 'USER_DROPPED' ||
      paymentStatus === 'CANCELLED' ||
      eventType === 'PAYMENT_FAILED_WEBHOOK';

    if (isFailure) {
      const failReason = paymentData?.payment_message || `Payment ${paymentStatus || 'failed'}`;

      const { error: paymentUpdateError } = await supabaseAdmin
        .from('order_payments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderRecord.id);

      if (paymentUpdateError) {
        throw new Error(`Webhook failed to update order_payments status to cancelled: ${paymentUpdateError.message}`);
      }

      const { error: orderUpdateError } = await supabaseAdmin
        .from('online_orders')
        .update({
          payment: 'rejected',
          status: 'cancelled',
          transaction_details: `Payment Unsuccessful (Webhook): ${failReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderRecord.id);

      if (orderUpdateError) {
        throw new Error(`Webhook failed to update online_orders status to cancelled: ${orderUpdateError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Payment failure recorded.' });
    }

    return NextResponse.json({ success: true, message: 'Webhook event received.' });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal webhook processing error.',
      },
      { status: 500 }
    );
  }
}
