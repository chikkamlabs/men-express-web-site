'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PackageSearch,
  LogIn,
  Key,
  Phone,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';
import {
  trackOrderByOrderIdAndKey,
  loginCustomerByMobileAndKey,
  OrderWithDetails,
  CustomerProfileSummary,
} from '@/lib/profileStore';
import OrderDetails from '@/components/orderdetails';
import ProfileDetails from '@/components/profiledetails';

function ProfilePageContent() {
  const searchParams = useSearchParams();

  // Active view tab: 'track' or 'login'
  const initialTab = searchParams.get('tab') === 'login' ? 'login' : 'track';
  const [activeTab, setActiveTab] = useState<'track' | 'login'>(initialTab);

  // Track Order Form States
  const [trackOrderId, setTrackOrderId] = useState(
    searchParams.get('order_id') || ''
  );
  const [trackKey, setTrackKey] = useState(searchParams.get('key') || '');
  const [trackingLoading, setTrackingLoading] = useState(
    Boolean(searchParams.get('order_id') && searchParams.get('key'))
  );
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<OrderWithDetails | null>(
    null
  );

  // Login Form States
  const [loginMobile, setLoginMobile] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedInProfile, setLoggedInProfile] =
    useState<CustomerProfileSummary | null>(null);

  // If order_id and key were passed in URL params, automatically run tracking
  useEffect(() => {
    const urlOrderId = searchParams.get('order_id');
    const urlKey = searchParams.get('key');
    if (urlOrderId && urlKey) {
      let isMounted = true;
      trackOrderByOrderIdAndKey(urlOrderId, urlKey)
        .then((res) => {
          if (!isMounted) return;
          setTrackingLoading(false);
          if (res.success && res.order) {
            setTrackedOrder(res.order);
          } else {
            setTrackError(
              res.error ||
                'No matching order found for this Order ID and Profile Key.'
            );
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setTrackingLoading(false);
          setTrackError(
            'An error occurred while tracking your order. Please try again.'
          );
        });

      return () => {
        isMounted = false;
      };
    }
  }, [searchParams]);

  const runTrackOrder = async (orderIdVal: string, keyVal: string) => {
    setTrackError(null);
    setTrackedOrder(null);
    setTrackingLoading(true);

    try {
      const res = await trackOrderByOrderIdAndKey(orderIdVal, keyVal);
      if (res.success && res.order) {
        setTrackedOrder(res.order);
      } else {
        setTrackError(
          res.error ||
            'No matching order found for this Order ID and Profile Key.'
        );
      }
    } catch {
      setTrackError('An error occurred while tracking your order. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) {
      setTrackError('Please enter your Order ID.');
      return;
    }
    if (!trackKey.trim()) {
      setTrackError('Please enter your Profile Key.');
      return;
    }
    runTrackOrder(trackOrderId, trackKey);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggedInProfile(null);

    const cleanMobile = loginMobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!loginKey.trim()) {
      setLoginError('Please enter your Profile Key.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await loginCustomerByMobileAndKey(cleanMobile, loginKey);
      if (res.success && res.data) {
        setLoggedInProfile(res.data);
      } else {
        setLoginError(
          res.error ||
            'Invalid Mobile Number or Profile Key. Please check the credentials received on WhatsApp.'
        );
      }
    } catch {
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Banner */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/homepage"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>
        </div>

        {/* If Tracked Order is Active, show order details directly */}
        {trackedOrder ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-secondary/15 flex-wrap gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Tracking Result
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-primary font-mono">
                  {trackedOrder.order_id}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setTrackedOrder(null)}
                className="px-4 py-2 rounded-xl bg-surface border border-secondary/25 hover:border-primary text-xs font-bold uppercase tracking-wider text-primary transition-colors cursor-pointer"
              >
                Track Another Order
              </button>
            </div>

            <OrderDetails
              order={trackedOrder}
              onBack={() => setTrackedOrder(null)}
            />
          </div>
        ) : loggedInProfile ? (
          /* If Customer is Logged In, show Profile Details directly */
          <div className="space-y-6">
            <ProfileDetails
              profileData={loggedInProfile}
              onLogout={() => {
                setLoggedInProfile(null);
                setLoginKey('');
              }}
            />
          </div>
        ) : (
          /* Tab Selection: Track your Order vs Login */
          <div className="max-w-xl mx-auto space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-secondary block">
                CUSTOMER SERVICES
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-primary">
                Order Tracking & Profile
              </h1>
              <p className="text-xs sm:text-sm text-secondary">
                Track your live delivery status or log in to view complete purchase history.
              </p>
            </div>

            {/* Toggle Tabs: Track your Order vs Login */}
            <div className="p-1 rounded-2xl bg-surface border border-secondary/20 flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  setTrackError(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-primary text-surface shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-background'
                }`}
              >
                <PackageSearch className="w-4 h-4" />
                <span>Track your Order</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-primary text-surface shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-background'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>

            {/* TAB 1: TRACK YOUR ORDER */}
            {activeTab === 'track' && (
              <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-sm space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-primary">
                    Track Your Order
                  </h2>
                  <p className="text-xs text-secondary leading-relaxed">
                    Enter your Order ID and Profile Key to inspect the order details and real-time status timeline.
                  </p>
                </div>

                {/* WhatsApp Hint Callout */}
                <div className="p-3.5 rounded-2xl bg-accent/15 border border-accent/40 text-primary flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-discount shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Hint:</strong> You received your <strong>Order ID</strong> (e.g. <code>ME-XXXXXX-XXXX</code>) and <strong>Profile Key</strong> on WhatsApp (+91 9912999344) when your order was placed.
                  </p>
                </div>

                {trackError && (
                  <div className="p-3.5 rounded-2xl bg-crimson/10 border border-crimson/30 text-crimson text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{trackError}</span>
                  </div>
                )}

                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  {/* Order ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                      Order ID *
                    </label>
                    <input
                      type="text"
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      placeholder="e.g. ME-123456-7890"
                      className="w-full px-4 py-3 rounded-xl border border-secondary/25 bg-background text-xs sm:text-sm text-primary font-mono focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  {/* Profile Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Profile Key *
                      </label>
                      <span className="text-[10px] text-secondary">
                        sent on WhatsApp
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={trackKey}
                        onChange={(e) => setTrackKey(e.target.value)}
                        placeholder="Enter your profile key"
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-secondary/25 bg-background text-xs sm:text-sm text-primary font-mono focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                      <Key className="w-4 h-4 text-secondary absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Track CTA */}
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-[0.98]"
                  >
                    {trackingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Fetching Order...</span>
                      </>
                    ) : (
                      <>
                        <PackageSearch className="w-4 h-4 text-accent" />
                        <span>Track Order Now</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: LOGIN BUTTON / FORM */}
            {activeTab === 'login' && (
              <div className="p-6 sm:p-8 rounded-3xl border border-secondary/20 bg-surface shadow-sm space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-primary">
                    Customer Login
                  </h2>
                  <p className="text-xs text-secondary leading-relaxed">
                    Log in with your Mobile number and Profile Key to access your profile details, saved address, and all previous orders.
                  </p>
                </div>

                {/* WhatsApp Hint Callout */}
                <div className="p-3.5 rounded-2xl bg-accent/15 border border-accent/40 text-primary flex items-start gap-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-discount shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Note:</strong> Your Profile Key was created when placing an order and sent to your WhatsApp number (+91 9912999344).
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-2xl bg-crimson/10 border border-crimson/30 text-crimson text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={loginMobile}
                        onChange={(e) => setLoginMobile(e.target.value)}
                        placeholder="e.g. 9876543210 (10 digits)"
                        maxLength={15}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-secondary/25 bg-background text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                      <Phone className="w-4 h-4 text-secondary absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Profile Key */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                      Profile Key *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={loginKey}
                        onChange={(e) => setLoginKey(e.target.value)}
                        placeholder="Enter your profile key"
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-secondary/25 bg-background text-xs sm:text-sm text-primary font-mono focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                      <Key className="w-4 h-4 text-secondary absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Login CTA */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-[0.98]"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Logging In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-accent" />
                        <span>Login to Profile</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
