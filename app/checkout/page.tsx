'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import {
  useCart,
  calculateCartSummary,
  clearCart,
} from '@/lib/cartStore';
import {
  getCustomerByMobile,
  getCustomerAddress,
  placeOnlineOrder,
} from '@/lib/ordersStore';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();
  const summary = calculateCartSummary(items, 100);

  // Form states
  const [mobile, setMobile] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [houseStreet, setHouseStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');

  // Status feedback
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerSearchStatus, setCustomerSearchStatus] = useState<string | null>(null);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderPlacedData, setOrderPlacedData] = useState<{
    orderId: string;
    customerKey: string;
    whatsappUrl: string;
  } | null>(null);

  // Search customer in Supabase customers table by mobile number
  const handleSearchCustomer = async (mobileToSearch = mobile) => {
    const clean = mobileToSearch.trim().replace(/\D/g, '').slice(-10);
    if (!clean || clean.length < 10) {
      setCustomerSearchStatus('Please enter a valid 10-digit mobile number.');
      setIsExistingCustomer(false);
      return;
    }

    try {
      setSearchingCustomer(true);
      setCustomerSearchStatus(null);
      setErrorMessage(null);

      const customer = await getCustomerByMobile(clean);
      if (customer && customer.id) {
        setIsExistingCustomer(true);

        // Fill customer name
        if (customer.name) {
          const parts = customer.name.trim().split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        if (customer.email) {
          setEmail(customer.email);
        }

        // Fetch saved address from customer_address table
        const savedAddress = await getCustomerAddress(customer.id);
        if (savedAddress) {
          setHouseStreet(savedAddress.address || '');
          setCity(savedAddress.city || '');
          setStateName(savedAddress.state || '');
          setPostalCode(savedAddress.postal_code || '');
          setLandmark(savedAddress.land_mark || '');
          setCustomerSearchStatus(`Welcome back, ${customer.name}! Your saved address was auto-filled.`);
        } else {
          setCustomerSearchStatus(`Welcome back, ${customer.name}! Please provide your delivery address.`);
        }
      } else {
        setIsExistingCustomer(false);
        setCustomerSearchStatus('New customer! Please fill in your delivery details below.');
      }
    } catch (err) {
      console.error('Error querying customer:', err);
      setCustomerSearchStatus('Could not verify customer record. You can still enter details manually.');
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchCustomer();
    }
  };

  // Place order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp mobile number.');
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }

    if (!houseStreet.trim()) {
      setErrorMessage('House / Street address is required.');
      return;
    }

    if (!city.trim() || !stateName.trim() || !postalCode.trim()) {
      setErrorMessage('City, State, and Postal Code are required.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    try {
      setPlacingOrder(true);

      const result = await placeOnlineOrder({
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mobile: cleanMobile,
          email: email.trim() || undefined,
        },
        address: {
          houseStreet: houseStreet.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          landmark: landmark.trim() || undefined,
        },
        items,
        amount: summary.totalSP,
        deliveryCharges: 100,
        payableAmount: summary.totalSP + 100,
      });

      if (!result.success || !result.whatsappUrl) {
        setErrorMessage(result.error || 'Failed to record order. Please try again.');
        setPlacingOrder(false);
        return;
      }

      // Order saved in online_orders & order_items successfully!
      // Clear cart
      clearCart();

      setOrderPlacedData({
        orderId: result.orderId!,
        customerKey: result.customerKey || '',
        whatsappUrl: result.whatsappUrl,
      });
      setPlacingOrder(false);

      // Redirect to WhatsApp (+91 9912999344)
      try {
        const waWin = window.open(result.whatsappUrl, '_blank');
        if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
          window.location.assign(result.whatsappUrl);
        }
      } catch {
        window.location.assign(result.whatsappUrl);
      }
    } catch (err) {
      console.error('Error during checkout order placement:', err);
      setErrorMessage('An unexpected error occurred while placing your order. Please try again.');
      setPlacingOrder(false);
    }
  };

  // Order Placed Success Screen
  if (orderPlacedData) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-text">
        <CouponsSection />
        <Header />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 sm:py-16 text-center flex flex-col items-center justify-center">
          <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-lg w-full space-y-6">
            <div className="w-16 h-16 rounded-full bg-discount/15 text-discount flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase text-primary tracking-tight">
                Order Placed Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-secondary mt-1">
                Your order has been recorded in Supabase and is ready for WhatsApp confirmation.
              </p>
            </div>

            {/* Credentials Card for Tracking */}
            <div className="p-4 rounded-2xl bg-background border border-secondary/25 space-y-3 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
                <span className="text-xs font-bold uppercase text-secondary">Order ID</span>
                <span className="text-sm font-black text-primary font-mono">{orderPlacedData.orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-secondary">Profile Key</span>
                <span className="text-sm font-black text-discount font-mono">{orderPlacedData.customerKey}</span>
              </div>
              <p className="text-[11px] text-secondary leading-snug pt-1">
                💡 <em>Save this Profile Key & Order ID. You can track your order status anytime on our Profile & Tracking page!</em>
              </p>
            </div>

            {/* WhatsApp CTA */}
            <div className="space-y-3">
              <a
                href={orderPlacedData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-discount text-surface font-bold text-sm uppercase tracking-wider hover:bg-emerald transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Confirm on WhatsApp (+91 9912999344)</span>
              </a>

              <Link
                href={`/profile?tab=track&order_id=${encodeURIComponent(orderPlacedData.orderId)}&key=${encodeURIComponent(orderPlacedData.customerKey)}`}
                className="w-full py-3 px-6 rounded-xl bg-surface border border-secondary/30 text-primary font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors flex items-center justify-center cursor-pointer"
              >
                Track Your Order Now →
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && !placingOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-text">
        <CouponsSection />
        <Header />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-secondary mb-4 stroke-[1.5]" />
          <h2 className="text-xl font-bold uppercase text-primary">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            There are no items to check out. Add items from our catalogue first.
          </p>
          <Link
            href="/productspage"
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-surface text-xs sm:text-sm font-semibold hover:bg-charcoal transition-colors cursor-pointer"
          >
            Explore Catalogue
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Banner */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Checkout Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* 2 Columns: Delivery Details (left) & Final Order Summary (right) matching reference screenshot */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT COLUMN: Delivery Details Card */}
          <div className="lg:col-span-7 xl:col-span-8 p-5 sm:p-7 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-secondary/15 flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
                  Delivery Details
                </h2>
                <p className="text-xs sm:text-sm text-secondary mt-0.5">
                  Enter your mobile number and press Enter to auto-fill your saved address.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-[11px] font-bold text-primary">
                <ShieldCheck className="w-3.5 h-3.5 text-discount" />
                <span>Secure Order</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mobile Number Search Section (matching screenshot) */}
            <div className="space-y-2 p-4 rounded-xl bg-background border border-secondary/20">
              <div className="flex items-center justify-between text-xs font-bold text-primary uppercase">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-secondary" />
                  Mobile Number (WhatsApp) *
                </span>
                <span className="text-[10px] text-secondary lowercase font-normal">
                  tap enter to auto-fill
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  onKeyDown={handleMobileKeyDown}
                  placeholder="e.g. 9876543210 (Press Enter to search)"
                  maxLength={15}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-secondary/30 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                  required
                />

                <button
                  type="button"
                  onClick={() => handleSearchCustomer()}
                  disabled={searchingCustomer}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-secondary/30 hover:border-primary text-xs sm:text-sm font-bold text-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {searchingCustomer ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>

              {/* Status Message */}
              {customerSearchStatus && (
                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${
                  isExistingCustomer ? 'text-discount font-medium' : 'text-secondary'
                }`}>
                  {isExistingCustomer ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{customerSearchStatus}</span>
                </p>
              )}
            </div>

            {/* Customer Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Address Line */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                House / Flat / Street Address *
              </label>
              <input
                type="text"
                value={houseStreet}
                onChange={(e) => setHouseStreet(e.target.value)}
                placeholder="Flat No, Apartment / Building name, Street"
                className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            {/* City, State & Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  City / Town *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Hyderabad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  State *
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Telangana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 500001"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {/* Landmark (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby hospital, school, or landmark"
                className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Final Order Summary Card (matching screenshot) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
                Final Order Summary
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pb-2 border-b border-secondary/15">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-primary truncate uppercase">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-secondary">
                        {item.sizeValue} • {item.colorName} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-extrabold text-primary shrink-0">
                      ₹{(item.s_p * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm text-secondary">
                <div className="flex items-center justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-primary">
                    ₹{summary.totalSP.toLocaleString('en-IN')}
                  </span>
                </div>

                {summary.totalSavings > 0 && (
                  <div className="flex items-center justify-between text-discount font-medium">
                    <span>Total MRP Savings</span>
                    <span className="font-bold">
                      - ₹{summary.totalSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-primary">
                    ₹100
                  </span>
                </div>
              </div>

              {/* Grand Total Amount */}
              <div className="pt-4 border-t border-secondary/20 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-primary block">
                    Total Amount
                  </span>
                  <span className="text-[10px] text-secondary">
                    Inclusive of taxes & delivery
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-primary">
                  ₹{(summary.totalSP + 100).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 text-accent" />
                    <span>Place Order via WhatsApp</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-secondary text-center leading-relaxed">
                Tapping <strong>Place Order</strong> records your order in Supabase and redirects to WhatsApp (<strong>+91 9912999344</strong>) for verification & dispatch.
              </p>
            </div>
          </div>
        </form>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
