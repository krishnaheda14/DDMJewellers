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
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: goldRates } = useQuery({
    queryKey: ["/api/gullak/gold-rates"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden bg-gradient-to-r from-black/40 to-transparent">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Exquisite
              <br />
              <span className="text-gold">Jewelry Collections</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover timeless elegance with our handcrafted jewelry pieces designed to celebrate life's precious moments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gold hover:bg-gold/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
                onClick={() => navigate("/products")}
              >
                Explore Collections
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-deep-navy px-8 py-4 rounded-full font-semibold text-lg transition-all"
                onClick={() => navigate("/products?featured=true")}
              >
                Featured Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Gold Rates */}
      {goldRates && (
        <section className="py-16 bg-gradient-to-r from-gold/10 via-cream-bg to-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp className="h-8 w-8 text-gold" />
                <h2 className="text-3xl font-bold text-deep-navy">Live Gold Rates</h2>
                <Coins className="h-8 w-8 text-gold" />
              </div>
              <p className="text-warm-gray text-lg">Current market prices for gold investments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <Card className="border-2 border-gold/20 hover:border-gold/40 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="bg-gold/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gold font-bold text-xl">24K</span>
                  </div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-2">24 Karat Gold</h3>
                  <p className="text-3xl font-bold text-gold mb-1">
                    ₹{new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate24k))}
                  </p>
                  <p className="text-sm text-warm-gray">per gram</p>
                  <Badge variant="secondary" className="mt-3 bg-green-100 text-green-800">
                    99.9% Pure
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/20 hover:border-gold/40 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="bg-gold/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gold font-bold text-xl">22K</span>
                  </div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-2">22 Karat Gold</h3>
                  <p className="text-3xl font-bold text-gold mb-1">
                    ₹{new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate22k))}
                  </p>
                  <p className="text-sm text-warm-gray">per gram</p>
                  <Badge variant="secondary" className="mt-3 bg-blue-100 text-blue-800">
                    91.7% Pure
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/20 hover:border-gold/40 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="bg-gold/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gold font-bold text-xl">18K</span>
                  </div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-2">18 Karat Gold</h3>
                  <p className="text-3xl font-bold text-gold mb-1">
                    ₹{new Intl.NumberFormat('en-IN').format(parseInt(goldRates.rate18k))}
                  </p>
                  <p className="text-sm text-warm-gray">per gram</p>
                  <Badge variant="secondary" className="mt-3 bg-purple-100 text-purple-800">
                    75.0% Pure
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-sm text-warm-gray mb-4">
                Last updated: {new Date().toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/gullak")}
                  className="bg-gold hover:bg-gold/90 text-white"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Start Gold Savings with Gullak
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/products?search=gold")}
                  className="border-gold text-gold hover:bg-gold hover:text-white"
                >
                  Browse Gold Jewelry
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Featured Categories</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Explore our carefully curated collections of fine jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.slice(0, 4).map((category) => (
              <Card 
                key={category.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300"
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
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold text-deep-navy mb-2 group-hover:text-gold transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-warm-gray">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Experience Innovation</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Revolutionary features that transform how you discover and design jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Custom Jewelry Design */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg">
              <div className="relative">
                <div 
                  className="h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gold text-white">NEW</Badge>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gold/10 rounded-full">
                    <Palette className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-deep-navy">Custom Jewelry Design</h3>
                </div>
                <p className="text-warm-gray mb-6 leading-relaxed">
                  Upload your design ideas, sketches, or inspiration photos. Our master craftsmen will bring your unique vision to life with expert precision and artistry.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-warm-gray">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    Upload design sketches or photos
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    Expert consultation and feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    Custom quotes and timeline
                  </li>
                </ul>
                <Button 
                  className="w-full bg-gold hover:bg-gold/90 text-white"
                  onClick={() => navigate("/custom-jewelry")}
                >
                  Start Custom Design
                </Button>
              </CardContent>
            </Card>

            {/* AI Try-On */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg">
              <div className="relative">
                <div 
                  className="h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1506629905607-c4bae1b1c5e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-600 text-white">AI POWERED</Badge>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-deep-navy">Virtual Try-On</h3>
                </div>
                <p className="text-warm-gray mb-6 leading-relaxed">
                  See how jewelry looks on you before making a purchase. Upload your photo and virtually try on necklaces, earrings, rings, and bracelets with AI technology.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-warm-gray">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Upload your photo securely
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Try on any jewelry piece
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Instant realistic preview
                  </li>
                </ul>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
      <section className="py-20 bg-cream-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Featured Collections</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Handpicked pieces from our latest collections
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-gray text-lg">No featured products available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gold text-gold hover:bg-gold hover:text-white px-8 py-3 rounded-full font-semibold text-lg transition-all"
              onClick={() => navigate("/products")}
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Collection Banner */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        <div className="absolute inset-0 bg-deep-navy/60" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Bridal Collection
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Make your special day even more memorable with our exquisite bridal jewelry collection. 
            Each piece is crafted to perfection, designed to complement your unique style and celebrate your love story.
          </p>
          <Button 
            size="lg"
            className="bg-gold hover:bg-gold/90 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
            onClick={() => navigate("/products?search=bridal")}
          >
            Explore Bridal Collection
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Why Choose DDM Jewellers</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Experience excellence in every aspect of your jewelry journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-cream-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <Gem className="w-8 h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-3">Premium Quality</h3>
              <p className="text-warm-gray">Only the finest materials and craftsmanship</p>
            </div>

            <div className="text-center group">
              <div className="bg-cream-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <ShieldCheck className="w-8 h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-3">Certified Authentic</h3>
              <p className="text-warm-gray">All jewelry comes with authenticity certificates</p>
            </div>

            <div className="text-center group">
              <div className="bg-cream-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <Truck className="w-8 h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-3">Free Delivery</h3>
              <p className="text-warm-gray">Complimentary secure delivery nationwide</p>
            </div>

            <div className="text-center group">
              <div className="bg-cream-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <RotateCcw className="w-8 h-8 text-gold group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-3">30-Day Returns</h3>
              <p className="text-warm-gray">Hassle-free returns within 30 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-deep-navy">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-xl text-white/80 mb-8">
            Be the first to know about new collections and exclusive offers
          </p>
          
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
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
