'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="w-full bg-background py-8 md:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Headlines, CTAs, and Replacement Banner Image */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <span className="inline-block text-xs md:text-sm font-bold tracking-widest text-secondary uppercase">
              AUTHENTIC MENSWEAR ESSENTIALS
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-primary leading-[1.15] tracking-tight font-medium">
              The Taste of Style, <br className="hidden sm:inline" />
              <span className="font-semibold text-primary">Redefined</span>
            </h1>

            <p className="text-base sm:text-lg text-text max-w-xl leading-relaxed">
              Men Express brings modern fits, uncompromised craftsmanship, and
              effortless daily luxury curated specifically for modern men.
            </p>

            {/* Action Buttons: 2 columns side-by-side on mobile */}
            <div className="pt-2 grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/productspage"
                className="w-full sm:w-auto px-3 sm:px-6 py-3 rounded-xl bg-primary text-surface font-bold text-xs sm:text-sm md:text-base hover:bg-charcoal transition-colors shadow-xs flex items-center justify-center text-center cursor-pointer"
              >
                Explore Collection
              </Link>
              <Link
                href="/reachus"
                className="w-full sm:w-auto px-3 sm:px-6 py-3 rounded-xl bg-surface border border-secondary/40 text-primary font-bold text-xs sm:text-sm md:text-base hover:bg-background transition-colors shadow-xs flex items-center justify-center text-center cursor-pointer"
              >
                Reach out store
              </Link>
            </div>
          </div>

          {/* Replacement for the 3 cards: Featured Menswear Image as requested */}
          <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden border border-secondary/20 shadow-md bg-surface">
            <Image
              src="/hero_feature.png"
              alt="Men Express Curated Essentials"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 bg-surface/90 backdrop-blur-xs rounded-xl px-4 py-2 border border-secondary/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                  Wardrobe Staples
                </p>
                <p className="text-xs text-secondary">
                  Premium fabrics engineered for durability & comfort
                </p>
              </div>
              <Link
                href="/productspage"
                className="text-xs font-extrabold text-primary uppercase tracking-wider border-b border-primary hover:text-secondary hover:border-secondary transition-colors cursor-pointer"
              >
                View All
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Image (hero1.png) with Style Note Overlay */}
        <div className="lg:col-span-6">
          <div className="relative w-full h-[450px] sm:h-[540px] lg:h-[600px] rounded-3xl overflow-hidden shadow-xl border border-secondary/20 bg-primary">
            <Image
              src="/hero1.png"
              alt="Men Express Fashion Collection"
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Dark overlay gradient at the bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />

            {/* Note overlay matching the reference layout */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-2 text-surface">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                CURATOR&apos;S NOTE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface leading-snug">
                Clothing that speaks before you say a single word.
              </h2>
              <p className="text-xs sm:text-sm text-surface/80 max-w-lg leading-relaxed">
                We bring together refined silhouettes, everyday resilience, and
                designer cuts so every piece you wear reflects confidence and
                distinction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
