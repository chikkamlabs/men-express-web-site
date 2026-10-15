'use client';

import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  XCircle,
  ArrowLeft,
  MapPin,
  Phone,
  ImageIcon,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { OrderWithDetails, OrderFulfillmentStatus } from '@/lib/profileStore';

interface OrderDetailsProps {
  order: OrderWithDetails;
  onBack?: () => void;
}

export default function OrderDetails({ order, onBack }: OrderDetailsProps) {
  const statusSteps: Array<{
    status: OrderFulfillmentStatus;
    label: string;
    description: string;
    icon: typeof Clock;
  }> = [
    {
      status: 'pending',
      label: 'Order Placed',
      description: 'Your order is recorded & awaiting WhatsApp confirmation',
      icon: Clock,
    },
    {
      status: 'payment_success',
      label: 'Payment Verified',
      description: 'Payment verified by Men Express team',
      icon: CheckCircle2,
    },
    {
      status: 'packed',
      label: 'Packed',
      description: 'Items carefully checked & packed',
      icon: Package,
    },
    {
      status: 'shipping',
      label: 'In Transit',
      description: 'Dispatched with express delivery partner',
      icon: Truck,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      description: 'Delivered to your address',
      icon: Check,
    },
  ];

  const isCancelled = order.status === 'cancelled';

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'payment_success':
        return 1;
      case 'packed':
        return 2;
      case 'shipping':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Order';

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-5 sm:p-7 rounded-3xl border border-secondary/20 bg-surface shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-secondary/15">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Orders List</span>
              </button>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">
                {order.order_id}
              </h2>
              <span className="text-xs text-secondary font-medium">
                • {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-crimson/15 text-crimson font-bold text-xs">
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelled</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-primary font-bold text-xs uppercase">
                <Receipt className="w-3.5 h-3.5 text-discount" />
                <span>Fulfillment: {order.status}</span>
              </span>
            )}
          </div>
        </div>

        {/* STATUS TIMELINE (check order_fulfillment_status) */}
        <div className="py-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary mb-6">
            Order Status Timeline
          </h3>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-crimson/10 border border-crimson/25 flex items-center gap-3 text-crimson text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">This order was cancelled</p>
                <p className="text-xs opacity-80 mt-0.5">
                  Contact support on WhatsApp (+91 9912999344) for assistance or re-ordering.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Timeline Step Line */}
              <div className="hidden sm:grid grid-cols-5 gap-2 relative">
                {/* Horizontal Progress Bar */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-secondary/20 z-0">
                  <div
                    className="h-full bg-discount transition-all duration-500"
                    style={{
                      width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.status}
                      className="relative z-10 flex flex-col items-center text-center px-1"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-discount text-surface shadow-xs ring-4 ring-discount/20'
                            : 'bg-surface border-2 border-secondary/30 text-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      <span
                        className={`text-xs font-bold mt-2.5 uppercase tracking-tight ${
                          isCurrent
                            ? 'text-primary'
                            : isCompleted
                            ? 'text-discount'
                            : 'text-secondary/70'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-secondary mt-0.5 line-clamp-2 px-1">
                        {step.description}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="sm:hidden space-y-4 relative pl-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary/20">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="relative">
                      <div
                        className={`absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-discount text-surface ring-2 ring-discount/20'
                            : 'bg-surface border border-secondary/30 text-secondary'
                        }`}
                      >
                        <Icon className="w-3 h-3 stroke-[2.5]" />
                      </div>

                      <div>
                        <p
                          className={`text-xs font-bold uppercase ${
                            isCurrent
                              ? 'text-primary'
                              : isCompleted
                              ? 'text-discount'
                              : 'text-secondary'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-secondary mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Section: Items List (left) & Summary / Address (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT: Items Ordered */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl border border-secondary/20 bg-surface shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-primary">
              Items Ordered ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-secondary/15">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex items-center gap-3.5">
                    <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border border-secondary/20 bg-background shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-primary uppercase truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-secondary mt-0.5">
                        Size: <span className="font-semibold text-primary">{item.sizeValue}</span> • Color: <span className="font-semibold text-primary">{item.colorName}</span>
                      </p>
                      <p className="text-xs font-semibold text-secondary mt-1">
                        ₹{item.s_p.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm sm:text-base text-primary">
                        ₹{item.row_total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary py-4">No line item details found.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Financial Summary & Delivery Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price Breakdown */}
          <div className="p-5 sm:p-6 rounded-3xl border border-secondary/20 bg-surface shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-primary">
              Payment Summary
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm text-secondary">
              <div className="flex items-center justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-primary">
                  ₹{order.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-discount font-medium">
                  <span>Discount</span>
                  <span className="font-bold">
                    - ₹{order.discount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Delivery Charges</span>
                <span className="font-bold text-primary">
                  ₹{order.delivery_charges.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-secondary/15 flex items-baseline justify-between text-base font-black text-primary">
                <span>Total Payable</span>
                <span className="text-xl sm:text-2xl font-black">
                  ₹{order.payable_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-secondary flex items-center justify-between">
              <span>Payment Status:</span>
              <span className="font-bold text-primary uppercase">
                {order.payment || 'Pending'}
              </span>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="p-5 sm:p-6 rounded-3xl border border-secondary/20 bg-surface shadow-xs space-y-3.5">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-primary">
              Customer & Delivery Info
            </h3>

            <div className="space-y-2 text-xs text-secondary">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <p className="text-text leading-relaxed">
                  {order.transaction_details || 'Delivery address recorded in system.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <p className="font-semibold text-primary">
                  +91 {order.customer.mobile} ({order.customer.name})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
