import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Gem, ShieldCheck, Truck, RotateCcw, Sparkles, Camera, Palette, TrendingUp, Coins } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products?featured=true&limit=8"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: goldRates } = useQuery<{
    id: number;
    rate24k: string;
    rate22k: string;
    rate18k: string;
    silverRate: string;
    currency: string;
    effectiveDate: string;
    createdAt: string;
  }>({
    queryKey: ["/api/gullak/gold-rates"],
    staleTime: 2 * 60 * 1000, // 2 minutes for rates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white via-white to-amber-50/20">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] overflow-hidden bg-gradient-to-r from-black/40 to-transparent">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        <div className="relative z-10 flex items-center justify-center h-full safe-area">
          <div className="text-center container-fluid max-w-5xl">
            <h1 className="heading-xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Exquisite
              <br />
              <span className="text-gold">Jewelry Collections</span>
            </h1>
            <p className="responsive-text text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover timeless elegance with our handcrafted jewelry pieces designed to celebrate life's precious moments
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="btn-responsive bg-gold hover:bg-gold/90 text-white rounded-full font-semibold transition-all transform hover:scale-105 touch-target"
                onClick={() => navigate("/products")}
              >
                Explore Collections
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="btn-responsive border-2 border-gold bg-gold/20 text-gold hover:bg-gold hover:text-white rounded-full font-semibold transition-all touch-target backdrop-blur-sm"
                onClick={() => navigate("/products?featured=true")}
              >
                Featured Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Live Gold & Silver Rates */}
      <section className="py-6 bg-gradient-to-r from-amber-50/30 via-white to-gold/5 border-b border-gold/10">
        <div className="container-fluid">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-deep-navy flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              Live Gold & Silver Rates
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {/* 24K Gold */}
            <div className="bg-white border border-gold/20 rounded-lg p-3 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-medium text-gold">24K Gold</span>
              </div>
              <p className="text-lg font-bold text-deep-navy">
                ₹{goldRates ? new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate24k)) : '7,200'}
              </p>
              <p className="text-xs text-warm-gray">per gram</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-green-600">↗ +1.2%</span>
              </div>
            </div>

            {/* 22K Gold */}
            <div className="bg-white border border-gold/20 rounded-lg p-3 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-medium text-gold">22K Gold</span>
              </div>
              <p className="text-lg font-bold text-deep-navy">
                ₹{goldRates ? new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate22k)) : '6,600'}
              </p>
              <p className="text-xs text-warm-gray">per gram</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-green-600">↗ +0.8%</span>
              </div>
            </div>

            {/* 18K Gold */}
            <div className="bg-white border border-gold/20 rounded-lg p-3 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-medium text-gold">18K Gold</span>
              </div>
              <p className="text-lg font-bold text-deep-navy">
                ₹{goldRates ? new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate18k)) : '5,400'}
              </p>
              <p className="text-xs text-warm-gray">per gram</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-green-600">↗ +0.5%</span>
              </div>
            </div>

            {/* Silver */}
            <div className="bg-white border border-gray-300/40 rounded-lg p-3 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-medium text-gray-600">Silver</span>
              </div>
              <p className="text-lg font-bold text-deep-navy">
                ₹{goldRates?.silverRate ? new Intl.NumberFormat('en-IN').format(parseInt(goldRates.silverRate)) : '85'}
              </p>
              <p className="text-xs text-warm-gray">per gram</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-red-600">↘ -0.3%</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-warm-gray mb-3">
              Last updated: {new Date().toLocaleString('en-IN', { 
                timeStyle: 'short' 
              })} • Auto-refresh every 5 min
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                size="sm"
                onClick={() => navigate("/gullak")}
                className="bg-gold hover:bg-gold/90 text-white text-xs px-3 py-1"
              >
                <Coins className="h-3 w-3 mr-1" />
                Start Gullak
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => navigate("/products?search=gold")}
                className="border-gold text-gold hover:bg-gold hover:text-white text-xs px-3 py-1"
              >
                Gold Jewelry
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => navigate("/live-market-rates")}
                className="border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white text-xs px-3 py-1"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="p-responsive bg-white">
        <div className="container-fluid">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="heading-lg font-bold text-deep-navy mb-3 sm:mb-4">Featured Categories</h2>
            <p className="responsive-text text-warm-gray max-w-2xl mx-auto">
              Explore our carefully curated collections of fine jewelry
            </p>
          </div>

          <div className="responsive-grid gap-4 sm:gap-6 lg:gap-8">
            {categories.slice(0, 4).map((category) => (
              <Card 
                key={category.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover-effect touch-target"
                onClick={() => navigate(`/products?categoryId=${category.id}`)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg aspect-square">
                    <img 
                      src={category.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="responsive-card">
                    <h3 className="responsive-text font-semibold text-deep-navy mb-2 group-hover:text-gold transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-warm-gray">
                      {category.description || "Discover our beautiful collection"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="p-responsive bg-white">
        <div className="container-fluid">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="heading-lg font-bold text-deep-navy mb-3 sm:mb-4">Experience Innovation</h2>
            <p className="responsive-text text-warm-gray max-w-2xl mx-auto">
              Revolutionary features that transform how you discover and design jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Custom Jewelry Design */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover-effect">
              <div className="relative">
                <div 
                  className="h-48 sm:h-56 lg:h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <Badge className="bg-gold text-white text-xs">NEW</Badge>
                </div>
              </div>
              <CardContent className="responsive-card">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gold/10 rounded-full">
                    <Palette className="h-4 w-4 sm:h-6 sm:w-6 text-gold" />
                  </div>
                  <h3 className="responsive-text font-bold text-deep-navy">Custom Jewelry Design</h3>
                </div>
                <p className="text-warm-gray mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  Upload your design ideas, sketches, or inspiration photos. Our master craftsmen will bring your unique vision to life with expert precision and artistry.
                </p>
                <ul className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm text-warm-gray">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-gold" />
                    Upload design sketches or photos
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-gold" />
                    Expert consultation and feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-gold" />
                    Custom quotes and timeline
                  </li>
                </ul>
                <Button 
                  className="w-full btn-responsive bg-gold hover:bg-gold/90 text-white touch-target"
                  onClick={() => navigate("/custom-jewelry")}
                >
                  Start Custom Design
                </Button>
              </CardContent>
            </Card>

            {/* AI Try-On */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover-effect">
              <div className="relative">
                <div 
                  className="h-48 sm:h-56 lg:h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1506629905607-c4bae1b1c5e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <Badge className="bg-purple-600 text-white text-xs">AI POWERED</Badge>
                </div>
              </div>
              <CardContent className="responsive-card">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                    <Camera className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h3 className="responsive-text font-bold text-deep-navy">Virtual Try-On</h3>
                </div>
                <p className="text-warm-gray mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  See how jewelry looks on you before making a purchase. Upload your photo and virtually try on necklaces, earrings, rings, and bracelets with AI technology.
                </p>
                <ul className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm text-warm-gray">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    Upload your photo securely
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    Try on any jewelry piece
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    Instant realistic preview
                  </li>
                </ul>
                <Button 
                  className="w-full btn-responsive bg-purple-600 hover:bg-purple-700 text-white touch-target"
                  onClick={() => navigate("/ai-tryon")}
                >
                  Try Virtual Fitting
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="p-responsive bg-cream-white">
        <div className="container-fluid">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="heading-lg font-bold text-deep-navy mb-3 sm:mb-4">Featured Collections</h2>
            <p className="responsive-text text-warm-gray max-w-2xl mx-auto">
              Handpicked pieces from our latest collections
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="responsive-grid gap-4 sm:gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-warm-gray responsive-text">No featured products available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="btn-responsive border-2 border-gold text-gold hover:bg-gold hover:text-white rounded-full font-semibold transition-all touch-target"
              onClick={() => navigate("/products")}
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Collection Banner */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        <div className="absolute inset-0 bg-deep-navy/60" />
        
        <div className="relative z-10 container-fluid text-center">
          <h2 className="heading-xl font-bold text-white mb-4 sm:mb-6">
            Bridal Collection
          </h2>
          <p className="responsive-text text-white/90 mb-6 sm:mb-8 leading-relaxed">
            Make your special day even more memorable with our exquisite bridal jewelry collection. 
            Each piece is crafted to perfection, designed to complement your unique style and celebrate your love story.
          </p>
          <Button 
            size="lg"
            className="btn-responsive bg-gold hover:bg-gold/90 text-white rounded-full font-semibold transition-all transform hover:scale-105 touch-target"
            onClick={() => navigate("/products?search=bridal")}
          >
            Explore Bridal Collection
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="p-responsive bg-white">
        <div className="container-fluid">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="heading-lg font-bold text-deep-navy mb-3 sm:mb-4">Why Choose DDM Jewellers</h2>
            <p className="responsive-text text-warm-gray max-w-2xl mx-auto">
              Experience excellence in every aspect of your jewelry journey
            </p>
          </div>

          <div className="responsive-grid gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center group hover-effect">
              <div className="bg-cream-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-gold transition-colors">
                <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="responsive-text font-semibold text-deep-navy mb-2 sm:mb-3">Premium Quality</h3>
              <p className="text-warm-gray text-sm sm:text-base">Only the finest materials and craftsmanship</p>
            </div>

            <div className="text-center group hover-effect">
              <div className="bg-cream-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-gold transition-colors">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="responsive-text font-semibold text-deep-navy mb-2 sm:mb-3">Certified Authentic</h3>
              <p className="text-warm-gray text-sm sm:text-base">All jewelry comes with authenticity certificates</p>
            </div>

            <div className="text-center group hover-effect">
              <div className="bg-cream-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-gold transition-colors">
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="responsive-text font-semibold text-deep-navy mb-2 sm:mb-3">Free Delivery</h3>
              <p className="text-warm-gray text-sm sm:text-base">Complimentary secure delivery nationwide</p>
            </div>

            <div className="text-center group hover-effect">
              <div className="bg-cream-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-gold transition-colors">
                <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="responsive-text font-semibold text-deep-navy mb-2 sm:mb-3">30-Day Returns</h3>
              <p className="text-warm-gray text-sm sm:text-base">Hassle-free returns within 30 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 bg-deep-navy">
        <div className="container-fluid text-center">
          <h2 className="heading-lg font-bold text-white mb-3 sm:mb-4">Stay Updated</h2>
          <p className="responsive-text text-white/80 mb-6 sm:mb-8">
            Be the first to know about new collections and exclusive offers
          </p>
          
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 sm:gap-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-6 py-3 rounded-full border-0 focus:ring-2 focus:ring-gold outline-none text-deep-navy"
            />
            <Button className="bg-gold hover:bg-gold/90 text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
