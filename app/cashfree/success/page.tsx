'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';

interface PaymentDetails {
  cf_order_id: string;
  cf_payment_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  paid_at: string;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [verifying, setVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [customerKey, setCustomerKey] = useState<string>('');

  const handleRetry = () => {
    if (!orderId) return;
    setVerifying(true);
    setErrorMessage(null);

    fetch('/api/payments/cashfree/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || 'Failed to verify payment with Cashfree.');
        }
        if (data.is_paid) {
          setPaymentData(data.payment);
          setCustomerKey(data.customer_key || '');
        } else {
          router.push(
            `/cashfree/failed?order_id=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(
              data.reason || 'Payment status is not paid'
            )}`
          );
        }
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred during verification.'
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  };

  useEffect(() => {
    if (!orderId) return;

    let isCancelled = false;

    const runVerification = async () => {
      try {
        const res = await fetch('/api/payments/cashfree/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId }),
        });

        const data = await res.json();

        if (isCancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to verify payment with Cashfree.');
        }

        if (data.is_paid) {
          setPaymentData(data.payment);
          setCustomerKey(data.customer_key || '');
        } else {
          router.push(
            `/cashfree/failed?order_id=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(
              data.reason || 'Payment status is not paid'
            )}`
          );
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error verifying payment:', err);
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected error occurred during verification.'
          );
        }
      } finally {
        if (!isCancelled) {
          setVerifying(false);
        }
      }
    };

    runVerification();

    return () => {
      isCancelled = true;
    };
  }, [orderId, router]);

  if (!orderId) {
    return (
      <div className="max-w-xl w-full mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="p-8 rounded-3xl border border-crimson/30 bg-surface shadow-lg w-full space-y-5">
          <div className="w-14 h-14 rounded-full bg-crimson/15 text-crimson flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase text-crimson tracking-tight">
              Order ID Missing
            </h2>
            <p className="text-xs text-secondary mt-1">
              No order_id parameter was provided in the return URL.
            </p>
          </div>
          <Link
            href="/checkout"
            className="w-full py-3 px-6 rounded-xl border border-secondary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors flex items-center justify-center cursor-pointer"
          >
            Return to Checkout
          </Link>
        </div>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="max-w-xl w-full mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
        <div className="p-8 rounded-3xl border border-secondary/20 bg-surface shadow-lg w-full space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-bold uppercase text-primary tracking-tight">
            Verifying Cashfree Payment
          </h2>
          <p className="text-xs text-secondary">
            Syncing order #{orderId || '...'} status with database...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-xl w-full mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="p-8 rounded-3xl border border-crimson/30 bg-surface shadow-lg w-full space-y-5">
          <div className="w-14 h-14 rounded-full bg-crimson/15 text-crimson flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase text-crimson tracking-tight">
              Payment Verification Failed
            </h2>
            <p className="text-xs text-secondary mt-1">
              An error occurred while confirming payment status with Cashfree.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-crimson/10 border border-crimson/25 text-left text-xs font-mono text-crimson break-words">
            {errorMessage}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleRetry}
              className="w-full py-3 px-6 rounded-xl bg-primary text-surface font-bold text-xs uppercase tracking-wider hover:bg-charcoal transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Verification</span>
            </button>

            <Link
              href="/checkout"
              className="w-full py-3 px-6 rounded-xl border border-secondary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors flex items-center justify-center cursor-pointer"
            >
              Return to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-12 sm:py-16 text-center flex flex-col items-center justify-center">
      <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-lg w-full space-y-6">
        <div className="w-16 h-16 rounded-full bg-discount/15 text-discount flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase text-primary tracking-tight">
            Payment Successful!
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Your Cashfree payment was verified and your order is confirmed.
          </p>
        </div>

        {/* Order & Payment Summary Card */}
        <div className="p-5 rounded-2xl bg-background border border-secondary/25 space-y-3 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
            <span className="text-xs font-bold uppercase text-secondary">Order ID</span>
            <span className="text-sm font-black text-primary font-mono">{orderId}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
            <span className="text-xs font-bold uppercase text-secondary">Payment Gateway</span>
            <span className="text-xs font-bold text-primary uppercase">Cashfree PG</span>
          </div>

          {paymentData?.amount && (
            <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
              <span className="text-xs font-bold uppercase text-secondary">Amount Paid</span>
              <span className="text-sm font-black text-primary">
                ₹{Number(paymentData.amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {paymentData?.transaction_id && (
            <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
              <span className="text-xs font-bold uppercase text-secondary">Transaction Ref</span>
              <span className="text-xs font-mono font-medium text-secondary truncate max-w-[200px]">
                {paymentData.transaction_id}
              </span>
            </div>
          )}

          {customerKey && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase text-secondary">Profile Key</span>
              <span className="text-xs font-mono font-bold text-discount">{customerKey}</span>
            </div>
          )}
        </div>

        {/* CTA Actions */}
        <div className="space-y-3 pt-2">
          {orderId && (
            <Link
              href={`/profile?tab=track&order_id=${encodeURIComponent(orderId)}${
                customerKey ? `&key=${encodeURIComponent(customerKey)}` : ''
              }`}
              className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs uppercase tracking-wider hover:bg-charcoal transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-accent" />
              <span>Track Your Order</span>
            </Link>
          )}

          <Link
            href="/productspage"
            className="w-full py-3 px-6 rounded-xl bg-surface border border-secondary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-secondary text-[11px] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Payment secured & recorded in database</span>
        </div>
      </div>
    </div>
  );
}

export default function CashfreeSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <CouponsSection />
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
