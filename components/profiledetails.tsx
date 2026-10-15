'use client';

import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Key,
  MapPin,
  Package,
  Calendar,
  ChevronRight,
  LogOut,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from 'lucide-react';
import { CustomerProfileSummary, OrderWithDetails } from '@/lib/profileStore';
import OrderDetails from '@/components/orderdetails';

interface ProfileDetailsProps {
  profileData: CustomerProfileSummary;
  onLogout?: () => void;
  initialSelectedOrderId?: string | null;
}

export default function ProfileDetails({
  profileData,
  onLogout,
  initialSelectedOrderId,
}: ProfileDetailsProps) {
  const { customer, address, orders } = profileData;

  // Selected Order State for drill-down view
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    () => {
      if (initialSelectedOrderId && orders && orders.length > 0) {
        return (
          orders.find(
            (o) =>
              o.order_id.toLowerCase() ===
              initialSelectedOrderId.toLowerCase()
          ) || null
        );
      }
      return null;
    }
  );

  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    if (!customer.key) return;
    navigator.clipboard.writeText(customer.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // If an order is selected, directly display it using components/orderdetails.tsx
  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <OrderDetails
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_success':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-discount/15 text-discount text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            <span>{status.replace('_', ' ')}</span>
          </span>
        );
      case 'packed':
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/40 text-primary text-[11px] font-bold uppercase tracking-wider">
            <Truck className="w-3 h-3 text-discount" />
            <span>{status}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-crimson/15 text-crimson text-[11px] font-bold uppercase tracking-wider">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Profile Top Card: Customer Identity & Actions */}
      <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-secondary/15">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-surface flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-7 h-7 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight">
                  {customer.name}
                </h2>
                {customer.points !== undefined && customer.points > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-primary text-[10px] font-black uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{customer.points} Points</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Registered Customer Account
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-secondary/30 hover:border-crimson text-xs font-bold uppercase tracking-wider text-secondary hover:text-crimson transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>

        {/* 2-Column Grid: Contact/Key & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs sm:text-sm">
          {/* Customer Credentials Card */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary">
              Account Credentials
            </h3>

            <div className="p-4 rounded-2xl bg-background border border-secondary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Mobile
                </span>
                <span className="font-bold text-primary font-mono">
                  +91 {customer.mobile}
                </span>
              </div>

              {customer.email && (
                <div className="flex items-center justify-between border-t border-secondary/15 pt-2.5">
                  <span className="text-secondary flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </span>
                  <span className="font-medium text-primary truncate max-w-[180px]">
                    {customer.email}
                  </span>
                </div>
              )}

              {customer.key && (
                <div className="flex items-center justify-between border-t border-secondary/15 pt-2.5">
                  <span className="text-secondary flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-accent" />
                    Profile Key
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-discount font-mono text-xs">
                      {customer.key}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      title="Copy Profile Key"
                      className="p-1 rounded-md text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedKey ? (
                        <Check className="w-3.5 h-3.5 text-discount" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-secondary leading-snug">
              💡 <em>Use your Mobile number and Profile Key anytime to access your order history and live updates.</em>
            </p>
          </div>

          {/* Delivery Address Card */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary">
              Saved Delivery Address
            </h3>

            <div className="p-4 rounded-2xl bg-background border border-secondary/20 min-h-[110px] flex flex-col justify-center">
              {address ? (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-discount shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-primary font-medium leading-relaxed">
                      {address.address}
                      {address.land_mark ? `, Landmark: ${address.land_mark}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-secondary pl-6">
                    {address.city}, {address.state} -{' '}
                    <span className="font-semibold text-primary">{address.postal_code}</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-secondary text-xs">
                  <MapPin className="w-4 h-4" />
                  <span>No saved address yet. It will be recorded when you checkout your next order.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Order History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <span>Your Orders ({orders?.length || 0})</span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Select any order to view complete item details, pricing breakdown, and fulfillment status timeline.
            </p>
          </div>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const formattedDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface hover:border-primary transition-all duration-200 cursor-pointer shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-black text-primary font-mono tracking-tight group-hover:text-discount transition-colors">
                        {order.order_id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-secondary flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      <span>•</span>
                      <span>
                        {order.items?.length || 0}{' '}
                        {order.items?.length === 1 ? 'item' : 'items'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        Payment: <strong className="text-primary">{order.payment || 'Pending'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-secondary/15">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-secondary block">
                        Total Amount
                      </span>
                      <span className="text-base sm:text-lg font-black text-primary">
                        ₹{order.payable_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-background border border-secondary/25 group-hover:bg-primary group-hover:text-surface group-hover:border-primary flex items-center justify-center transition-all text-secondary shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 rounded-3xl border border-secondary/20 bg-surface text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-secondary mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <h4 className="text-base font-bold uppercase text-primary">
                No Orders Placed Yet
              </h4>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                You haven&apos;t placed any online orders with this account yet. Browse our collection and place your first order!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
