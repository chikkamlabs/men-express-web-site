'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  Send,
  ArrowLeft,
  CheckCircle2,
  Store,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CouponsSection from '@/components/couponsSection';

export default function ReachUsPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [sentToast, setSentToast] = useState(false);

  const STORE_MAP_URL = 'https://maps.app.goo.gl/hYBvHUdhut6iDh3g6';
  const STORE_PHONE = '+919912999344';
  const STORE_PHONE_DISPLAY = '+91 9912999344';
  const WHATSAPP_NUMBER = '919912999344';

  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!name.trim() || !cleanMobile || !message.trim()) {
      return;
    }

    const formattedMessage =
      `*NEW ENQUIRY - MEN EXPRESS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Name:* ${name.trim()}\n` +
      `*Mobile Number:* +91 ${cleanMobile}\n` +
      `*Message:* ${message.trim()}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Sent via Men Express Store Enquiry.`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(formattedMessage)}`;

    setSentToast(true);
    setTimeout(() => {
      setSentToast(false);
    }, 3000);

    // Open WhatsApp with formatted message
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Banner */}
      <CouponsSection />

      {/* 2. Header */}
      <Header />

      {/* 3. Main Reach Us Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/homepage"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Section Headline */}
        <div className="mb-8 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary block">
            VISIT OR CONNECT
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-primary mt-1">
            Reach Us
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1.5 max-w-xl">
            Visit our physical retail outlet, call our dedicated store assistant, or send us an instant enquiry on WhatsApp.
          </p>
        </div>

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT COLUMN: Store Location & Call Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Store Location Card */}
            <div className="p-5 sm:p-7 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-surface flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-primary uppercase tracking-tight">
                      Men Express Flagship Store
                    </h2>
                    <p className="text-xs text-secondary">
                      Premium Menswear Retail Outlet
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-[11px] font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5 text-discount" />
                  <span>Open Today</span>
                </span>
              </div>

              {/* Store Address & Hours Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-secondary/15 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-xs">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    Store Address
                  </span>
                  <p className="text-secondary leading-relaxed">
                    Men Express Menswear, Main Road Store, Telangana, India.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-xs">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    Working Hours
                  </span>
                  <p className="text-secondary leading-relaxed">
                    Monday – Sunday: 10:00 AM – 10:00 PM
                  </p>
                </div>
              </div>

              {/* Embedded Interactive Map Card */}
              <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-secondary/25 bg-background">
                <iframe
                  title="Men Express Store Location"
                  src="https://maps.google.com/maps?q=Men%20Express&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Direct Google Maps Overlay CTA Button */}
                <div className="absolute bottom-3 right-3 z-10">
                  <a
                    href={STORE_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-surface text-xs font-bold uppercase tracking-wider hover:bg-charcoal transition-all shadow-md cursor-pointer"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-accent" />
                  </a>
                </div>
              </div>

              {/* Call CTA Card & Direct Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-background border border-secondary/20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                      Direct Store Phone
                    </span>
                    <span className="text-base sm:text-lg font-black text-primary">
                      {STORE_PHONE_DISPLAY}
                    </span>
                  </div>
                </div>

                {/* Call CTA Button */}
                <a
                  href={`tel:${STORE_PHONE}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4 text-accent" />
                  <span>Call Store</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Direct WhatsApp Enquiry Form (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="p-5 sm:p-7 rounded-2xl border border-secondary/20 bg-surface shadow-xs space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-discount" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-primary uppercase tracking-tight">
                    Send an Enquiry
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-secondary mt-1">
                  Have a question about sizing, custom fits, or store availability? Message us directly.
                </p>
              </div>

              {sentToast && (
                <div className="p-3.5 rounded-xl bg-discount/10 border border-discount/30 text-discount text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Enquiry formatted! Opening WhatsApp...</span>
                </div>
              )}

              <form onSubmit={handleSendEnquiry} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Message / Query *
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your enquiry regarding products, stock, or store location..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-surface text-xs sm:text-sm text-primary focus:outline-none focus:border-primary transition-colors resize-none"
                    required
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-charcoal transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Send className="w-4 h-4 text-accent" />
                  <span>Send Enquiry via WhatsApp</span>
                </button>
              </form>

              <p className="text-[10px] text-secondary text-center leading-relaxed">
                Your message will open directly in WhatsApp with our official store support (+91 9912999344).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
