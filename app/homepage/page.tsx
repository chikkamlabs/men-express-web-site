import CouponsSection from '@/components/couponsSection';
import Header from '@/components/header';
import HeroSection from '@/components/herosection';
import CategoriesSection from '@/components/categories';
import PosterSection from '@/components/posterSection';
import FeaturedProductsSection from '@/components/featuredproductsSection';
import Footer from '@/components/footer';

export default function Homepage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {/* 1. Coupons Section (Sticks to top) */}
      <CouponsSection />

      {/* 2. Header Section (Sticks directly below coupons section) */}
      <Header />

      {/* 3. Hero Section */}
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <PosterSection />
        <FeaturedProductsSection />
      </main>

      {/* 4. Footer Section */}
      <Footer />
    </div>
  );
}
