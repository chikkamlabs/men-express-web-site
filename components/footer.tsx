
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShieldCheck, FileText, Truck, RefreshCcw } from 'lucide-react';

type PolicyKey = 'legal' | 'terms' | 'privacy' | 'refund' | 'shipping';

const policies: Record<
  PolicyKey,
  {
    title: string;
    updated: string;
    sections: { heading: string; content: string; bullets?: string[] }[];
  }
> = {
    legal: {
    title: 'Our Legal Profile',
    updated: 'October 2026',
    sections: [
      {
        heading: 'Business Information',
        content:
          'The following are the official business and contact details of Men Express.',
        bullets: [
          'Legal Name: VENKATA ARUN GOVIL KOLLEPARA',
          'Business / Trade Name: SATYAS MEN EXPRESS',
          'Email Address: menexpress.team@gmail.com',
          'Contact Number: 9912999344',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    updated: 'October 2026',
    sections: [
      {
        heading: '1. Account Registration',
        content:
          'Customers can browse and purchase products without creating an account. However, providing a valid mobile number is mandatory when placing an order to facilitate order confirmation, communication, and delivery.',
      },
      {
        heading: '2. Payment Methods',
        content:
          'Men Express accepts online payments exclusively through Cashfree. Cash on Delivery (COD) is not available. Orders will be processed upon successful payment confirmation.',
      },
      {
        heading: '3. Product Pricing & Taxes',
        content:
          'All product prices displayed on the website are inclusive of applicable taxes.',
      },
      {
        heading: '4. Order Acceptance & Cancellation',
        content:
          'Men Express reserves the right to cancel orders in exceptional circumstances, including incorrect pricing, product unavailability, or suspicious transactions. Customers will be informed in such situations, and applicable refunds will be processed.',
      },
      {
        heading: '5. Product Images & Descriptions',
        content:
          'We make every effort to display accurate product images, colours, and descriptions. However, slight variations in colour or appearance may occur due to screen settings and display differences.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated: 'October 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        content:
          'We collect customer information necessary to provide our services, including full name, mobile number, email address, delivery address, order details, and other relevant checkout information.',
      },
      {
        heading: '2. How We Use Your Information',
        content: 'Customer information is used for the following purposes:',
        bullets: [
          'Processing and managing orders.',
          'Confirming payments and providing order updates.',
          'Coordinating product delivery.',
          'Providing customer support.',
          'Sending promotional messages and relevant offers.',
        ],
      },
      {
        heading: '3. Sharing of Information',
        content:
          'We may share necessary customer information with delivery partners and service providers to facilitate order fulfilment, payment processing, and related services.',
      },
      {
        heading: '4. Data Storage',
        content:
          'Customer information and order details are stored in our database to support order management, customer service, and business operations.',
      },
      {
        heading: '5. Information Protection',
        content:
          'Men Express takes reasonable measures to protect customer information against unauthorized access, misuse, or disclosure.',
      },
    ],
  },

  refund: {
    title: 'Refund & Cancellation Policy',
    updated: 'October 2026',
    sections: [
      {
        heading: '1. No Return Policy',
        content:
          'Men Express does not accept product returns. Customers can request an exchange subject to the applicable exchange conditions.',
      },
      {
        heading: '2. Exchange Policy',
        content:
          'Customers may request an exchange for a different size or colour within 7 days of receiving the product, subject to product availability and approval by Men Express.',
      },
      {
        heading: '3. Damaged, Defective or Incorrect Products',
        content:
          'If a customer receives a damaged, defective, or incorrect product, Men Express will arrange a replacement after verification.',
      },
      {
        heading: '4. Order Cancellation',
        content:
          'Once an order is placed, customers cannot request cancellation. Orders cannot be cancelled after shipment either.',
      },
      {
        heading: '5. Refund Policy',
        content:
          'Men Express follows a no-refund policy. Eligible resolutions will be handled through product exchange or replacement, as applicable.',
      },
    ],
  },

  shipping: {
    title: 'Shipping & Delivery Policy',
    updated: 'October 2026',
    sections: [
      {
        heading: '1. Delivery Coverage',
        content:
          'Men Express provides delivery services across India, subject to serviceability at the customer’s delivery location.',
      },
      {
        heading: '2. Shipping Charges',
        content: 'Shipping charges are calculated based on the number of pieces ordered:',
        bullets: [
          '₹100 for orders containing up to 2 pieces.',
          '₹50 additional for every additional piece.',
          'These shipping charges apply across India.',
        ],
      },
      {
        heading: '3. Order Processing & Dispatch',
        content:
          'Orders are generally processed and dispatched within 1–2 working days after successful payment confirmation.',
      },
      {
        heading: '4. Delivery Timeline',
        content:
          'Estimated delivery time is 7–10 working days from dispatch, depending on the delivery location and courier service.',
      },
      {
        heading: '5. Order Tracking',
        content:
          'Customers can track their orders directly through the Men Express website using their Order ID.',
      },
      {
        heading: '6. Failed Delivery Attempts',
        content:
          'If delivery fails because the customer is unavailable or has provided an incorrect address, Men Express or its delivery partner will attempt delivery again.',
      },
    ],
  },
};

const policyLinks: {
  key: PolicyKey;
  label: string;
  icon: typeof FileText;
}[] = [
  { key: 'terms', label: 'Terms & Conditions', icon: FileText },
  { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { key: 'refund', label: 'Refund & Cancellation', icon: RefreshCcw },
  { key: 'shipping', label: 'Shipping & Delivery', icon: Truck },
];

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);

  const selectedPolicy = activePolicy ? policies[activePolicy] : null;

  useEffect(() => {
    if (!activePolicy) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePolicy(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activePolicy]);

  return (
    <>
      <footer className="w-full bg-primary text-surface border-t border-secondary/20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-secondary/20">

            {/* Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0">
                  <Image
                    src="/menexpress_logo.png"
                    alt="Men Express Logo"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-surface uppercase">
                  Men Express<sup className="text-[10px] ml-0.5 align-super">®</sup>
                </span>
              </div>

              <p className="font-semibold text-accent text-sm tracking-wide">
                Wear Your Mind !!!
              </p>

              <p className="text-secondary text-sm leading-relaxed max-w-sm">
                Your destination for modern menswear, refined fits, and enduring
                wardrobe staples tailored for ambition and everyday poise.
              </p>
            </div>

            {/* Shop */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
                Shop
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                <li>
                  <Link href="/homepage#featured-products" className="hover:text-accent transition-colors block">
                    New arrivals
                  </Link>
                </li>
                <li>
                  <Link href="/productspage" className="hover:text-accent transition-colors block">
                    Shop All
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-accent transition-colors block">
                    Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
                Customer
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                <li>
                  <Link href="/profile?tab=track" className="hover:text-accent transition-colors block">
                    Track order
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-accent transition-colors block">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
                Company
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                <li>
                  <Link href="/reachus" className="hover:text-accent transition-colors block">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/reachus" className="hover:text-accent transition-colors block">
                    Reach us
                  </Link>
                </li>
                <li>
      <button
        type="button"
        onClick={() => setActivePolicy('legal')}
        className="hover:text-accent transition-colors block text-left cursor-pointer"
      >
        Our Legal Profile
      </button>
    </li>
              </ul>
            </div>

            {/* Policies */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-surface">
                Policies
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                {policyLinks.map(({ key, label }) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setActivePolicy(key)}
                      className="hover:text-accent transition-colors block text-left cursor-pointer"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
            <p>© 2026 Men Express®. All rights reserved.</p>
            <p className="tracking-wide">
              Crafted for Men. Styled for Distinction.
            </p>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActivePolicy(null);
            }
          }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-title"
            className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-surface text-primary shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-secondary/20 bg-primary px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  Men Express®
                </p>
                <h2 id="policy-title" className="mt-1 text-lg sm:text-xl font-extrabold text-surface">
                  {selectedPolicy.title}
                </h2>
                <p className="mt-1 text-xs text-secondary">
                  Last updated: {selectedPolicy.updated}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                aria-label="Close policy"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-surface hover:bg-white/10 hover:text-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
              <div className="space-y-6">
                {selectedPolicy.sections.map((section, index) => (
                  <article key={index} className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-primary">
                      {section.heading}
                    </h3>

                    <p className="text-sm leading-7 text-secondary-foreground">
                      {section.content}
                    </p>

                    {section.bullets && (
                      <ul className="ml-1 space-y-2 pt-1">
                        {section.bullets.map((item, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            className="flex gap-2 text-sm leading-6 text-secondary-foreground"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-secondary/20 bg-background px-5 py-4 sm:px-7 flex items-center justify-between gap-3">
              <p className="text-[10px] sm:text-xs text-secondary">
                Men Express® · Wear Your Mind !!!
              </p>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-surface hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
