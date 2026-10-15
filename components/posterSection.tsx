'use client';

import Image from 'next/image';

export default function PosterSection() {
  return (
    <section className="w-full bg-background py-6 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Responsive Poster Banner */}
        <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-secondary/20 shadow-xs bg-[#FAF9F6] min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:h-[400px] flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-8 lg:p-14">
          {/* Responsive Background Poster Image */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/poster1.png"
              alt="Men Express Special Offer"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1200px"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Left Text: "Shop your clothes now" */}
          <div className="relative z-10 max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[320px]">
            <h3 className="font-extrabold uppercase text-sm sm:text-xl md:text-2xl lg:text-4xl tracking-tight text-crimson leading-tight">
              Shop your clothes now
            </h3>
          </div>

          {/* Right Text: "upto 35% discount" */}
          <div className="relative z-10 self-end md:self-center text-right mt-auto md:mt-0 max-w-[180px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[420px]">
            <span className="block font-black uppercase text-xl sm:text-3xl md:text-4xl lg:text-6xl tracking-tighter text-crimson leading-none">
              upto 35% discount
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
