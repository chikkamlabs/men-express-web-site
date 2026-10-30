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
  Tag,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import {
  useCart,
  useAppliedCoupon,
  calculateCartSummary,
  calculateDeliveryCharges,
  clearCart,
  setAppliedCoupon,
  AppliedCoupon,
} from '@/lib/cartStore';
import {
  getCustomerByMobile,
  getCustomerAddress,
  placeOnlineOrder,
} from '@/lib/ordersStore';
import { validateCoupon } from '@/lib/couponsStore';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();
  const appliedCoupon = useAppliedCoupon();

  // Coupon UI state
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Delivery charges: upto 2 items = 100. For every more than 2, +1 add 50 to delivery
  const deliveryCharges = calculateDeliveryCharges(
    items.reduce((acc, i) => acc + i.quantity, 0)
  );

  const itemsSubtotal = items.reduce((acc, i) => acc + i.s_p * i.quantity, 0);
  const rawEstimatedTotal = itemsSubtotal + deliveryCharges;
  const isCouponActive =
    appliedCoupon !== null &&
    items.length > 0 &&
    appliedCoupon.discount < rawEstimatedTotal;
  const currentDiscount = isCouponActive ? appliedCoupon.discount : 0;
  const summary = calculateCartSummary(items, deliveryCharges, currentDiscount);
  const payableAmount = summary.grandTotal;

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

  // Coupon handling in checkout
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    const itemsSubtotal = summary.totalSP;
    const estimatedTotal = itemsSubtotal + deliveryCharges;

    const result = await validateCoupon(cleanCode, itemsSubtotal, estimatedTotal);
    setCouponLoading(false);

    if (!result.valid || !result.coupon) {
      setCouponError(result.error || 'Invalid coupon code.');
      return;
    }

    const discountAmount = result.discount ?? Number(result.coupon.discount);

    const couponData: AppliedCoupon = {
      code: result.coupon.code,
      discount: discountAmount,
      sentence: result.coupon.sentence,
    };

    setAppliedCoupon(couponData);
    setShowCouponInput(false);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
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
        deliveryCharges,
        discount: currentDiscount,
        couponCode: appliedCoupon?.code || null,
        payableAmount,
      });

      if (!result.success || !result.whatsappUrl) {
        setErrorMessage(result.error || 'Failed to record order. Please try again.');
        setPlacingOrder(false);
        return;
      }

      // Order saved in online_orders & order_items successfully!
      // Clear cart and coupon
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
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/cart"
            className="w-9 h-9 rounded-full border border-secondary/20 flex items-center justify-center text-primary hover:bg-surface transition-colors cursor-pointer"
            aria-label="Back to Cart"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-primary">
              Checkout
            </h1>
            <p className="text-xs text-secondary">
              Direct dispatch & WhatsApp verification (+91 9912999344)
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Customer Mobile Verification & Delivery Details */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Step 1: Mobile Number Lookup */}
            <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Step 1 • Customer Identification
                </span>
                {isExistingCustomer && (
                  <span className="text-xs font-bold text-discount flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Existing Customer
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="customer-mobile" className="block text-xs font-bold uppercase text-primary mb-1.5">
                  Mobile Number (WhatsApp) <span className="text-crimson">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">
                      +91
                    </span>
                    <input
                      id="customer-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobile(val);
                        if (val.length === 10) {
                          handleSearchCustomer(val);
                        }
                      }}
                      onKeyDown={handleMobileKeyDown}
                      placeholder="9912999344"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary/30 bg-background text-sm font-semibold text-primary focus:outline-none focus:border-primary transition-all tracking-wider"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSearchCustomer()}
                    disabled={searchingCustomer || mobile.length < 10}
                    className="px-4 sm:px-5 py-3 rounded-xl bg-primary text-surface font-bold text-xs uppercase tracking-wider hover:bg-charcoal transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {searchingCustomer ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Find Account</span>
                      </>
                    )}
                  </button>
                </div>

                {customerSearchStatus && (
                  <p
                    className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${
                      isExistingCustomer ? 'text-discount' : 'text-secondary'
                    }`}
                  >
                    {isExistingCustomer && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{customerSearchStatus}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Step 2: Contact Information */}
            <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
                Step 2 • Contact Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-first-name" className="block text-xs font-bold uppercase text-primary mb-1.5">
                    First Name <span className="text-crimson">*</span>
                  </label>
                  <input
                    id="checkout-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkout-last-name" className="block text-xs font-bold uppercase text-primary mb-1.5">
                    Last Name
                  </label>
                  <input
                    id="checkout-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-email" className="block text-xs font-bold uppercase text-primary mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Step 3: Delivery Address Details */}
            <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Step 3 • Delivery Address
                </span>
                <span className="text-[11px] text-secondary flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Direct Doorstep Delivery
                </span>
              </div>

              <div>
                <label htmlFor="checkout-address" className="block text-xs font-bold uppercase text-primary mb-1.5">
                  House / Flat / Street Address <span className="text-crimson">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  value={houseStreet}
                  onChange={(e) => setHouseStreet(e.target.value)}
                  placeholder="Flat/House No., Building Name, Street, Area"
                  className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="checkout-city" className="block text-xs font-bold uppercase text-primary mb-1.5">
                    City <span className="text-crimson">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkout-state" className="block text-xs font-bold uppercase text-primary mb-1.5">
                    State <span className="text-crimson">*</span>
                  </label>
                  <input
                    id="checkout-state"
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkout-pincode" className="block text-xs font-bold uppercase text-primary mb-1.5">
                    PIN Code <span className="text-crimson">*</span>
                  </label>
                  <input
                    id="checkout-pincode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="500001"
                    maxLength={6}
                    className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors tracking-wider"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-landmark" className="block text-xs font-bold uppercase text-primary mb-1.5">
                  Landmark (Optional)
                </label>
                <input
                  id="checkout-landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near Metro Station / Temple / Supermarket"
                  className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background text-sm font-medium text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & WhatsApp Checkout CTA */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="p-5 sm:p-6 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
                <h2 className="text-lg font-extrabold text-primary tracking-tight">
                  Order Summary
                </h2>
                <span className="text-xs text-secondary font-bold">
                  {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

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

                {/* Coupon Code Section */}
                <div className="pt-1 pb-1 border-y border-dashed border-secondary/20">
                  {!appliedCoupon ? (
                    <div>
                      {!showCouponInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCouponInput(true);
                            setCouponError(null);
                          }}
                          className="text-xs font-bold text-accent hover:underline flex items-center justify-between w-full py-1 cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5 text-primary group-hover:text-accent transition-colors">
                            <Tag className="w-3.5 h-3.5 text-accent" />
                            <span>Do you have coupon?</span>
                          </span>
                          <span className="text-[11px] font-semibold text-accent underline underline-offset-2">
                            Apply
                          </span>
                        </button>
                      ) : (
                        <div className="py-1 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-primary">
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-accent" />
                              <span>Do you have coupon?</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCouponInput(false);
                                setCouponError(null);
                              }}
                              className="text-[11px] text-secondary hover:text-primary cursor-pointer font-medium"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value.toUpperCase());
                                setCouponError(null);
                              }}
                              placeholder="ENTER CODE"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-secondary/30 bg-background text-xs font-mono font-bold uppercase tracking-wider text-primary placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={couponLoading || !couponInput.trim()}
                              className="px-3.5 py-1.5 rounded-lg bg-primary text-surface text-xs font-bold uppercase hover:bg-charcoal transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                            >
                              {couponLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-discount/10 border border-discount/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-discount shrink-0" />
                        <div className="truncate">
                          <span className="font-mono font-bold text-xs text-discount uppercase">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-secondary block truncate">
                            ₹{appliedCoupon.discount.toLocaleString('en-IN')} off applied
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-secondary hover:text-crimson transition-colors ml-2 cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-crimson font-medium pt-1 leading-snug">
                      {couponError}
                    </p>
                  )}
                </div>

                {appliedCoupon && appliedCoupon.discount > 0 && (
                  <div className="flex items-center justify-between text-discount font-medium">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-bold">
                      - ₹{appliedCoupon.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Delivery Charges (upto 2 items = 100. for every more than 2, +1 add 50) */}
                <div className="flex items-center justify-between">
                  <div>
                    <span>Delivery Charge</span>
                    <span className="text-[11px] text-secondary ml-1">
                      ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    ₹{deliveryCharges.toLocaleString('en-IN')}
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
                  ₹{payableAmount.toLocaleString('en-IN')}
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
                By placing this order, you will be redirected to WhatsApp (+91 9912999344) to confirm and verify delivery.
              </p>

              <div className="pt-2 border-t border-secondary/15 flex items-center justify-center gap-1.5 text-secondary text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>100% Secure Checkout with Supabase Sync</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
