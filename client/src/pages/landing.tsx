import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, ShieldCheck, Star, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-deep-navy">
                <span className="text-gold">DDM</span> Jewellers
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = "/auth"}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-white"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = "/signup"}
                className="bg-gold hover:bg-gold/90 text-white"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to
              <br />
              <span className="text-gold">DDM Jewellers</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover exquisite jewelry collections that celebrate life's most precious moments. 
              Since 1985, we've been crafting timeless pieces with unparalleled elegance and quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gold hover:bg-gold/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
                onClick={() => window.location.href = "/auth"}
              >
                Explore Collections
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-deep-navy px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Why Choose DDM Jewellers</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Experience luxury, quality, and craftsmanship in every piece
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Gem className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="text-xl text-deep-navy">Premium Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-gray">
                  Only the finest materials and expert craftsmanship in every piece
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="text-xl text-deep-navy">Certified Authentic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-gray">
                  All jewelry comes with authenticity certificates and warranties
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="text-xl text-deep-navy">Timeless Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-gray">
                  Classic and contemporary designs that never go out of style
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="text-xl text-deep-navy">Since 1985</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-gray">
                  Nearly four decades of trusted service and expertise
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Collections Preview */}
      <section className="py-20 bg-cream-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-navy mb-4">Our Collections</h2>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Discover our diverse range of jewelry collections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Engagement Rings",
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
                description: "Forever begins with the perfect ring"
              },
              {
                name: "Necklaces",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
                description: "Elegant pieces for every occasion"
              },
              {
                name: "Earrings",
                image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
                description: "From subtle studs to statement drops"
              },
              {
                name: "Bracelets",
                image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
                description: "Beautiful bracelets and bangles"
              }
            ].map((collection, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg aspect-square">
                    <img 
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-deep-navy mb-2 group-hover:text-gold transition-colors">
                      {collection.name}
                    </h3>
                    <p className="text-warm-gray">
                      {collection.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-deep-navy">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have found their dream jewelry with DDM Jewellers
          </p>
          <Button 
            size="lg"
            className="bg-gold hover:bg-gold/90 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
            onClick={() => window.location.href = "/auth"}
          >
            Start Shopping Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-deep-navy mb-4">
                <span className="text-gold">DDM</span> Jewellers
              </h3>
              <p className="text-warm-gray mb-6">
                Crafting timeless pieces that celebrate life's precious moments since 1985.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-deep-navy mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">About Us</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Collections</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Custom Design</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Care Guide</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-deep-navy mb-4">Customer Service</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Size Guide</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-warm-gray hover:text-gold transition-colors">Returns</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-deep-navy mb-4">Contact Info</h4>
              <div className="space-y-3">
                <p className="text-warm-gray flex items-center">
                  📍 123 Jewelry Street, Mumbai, India
                </p>
                <p className="text-warm-gray flex items-center">
                  📞 +91 98765 43210
                </p>
                <p className="text-warm-gray flex items-center">
                  ✉️ info@ddmjewellers.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-warm-gray text-sm mb-4 md:mb-0">
                © 2024 DDM Jewellers. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-warm-gray hover:text-gold transition-colors">Privacy Policy</a>
                <a href="#" className="text-warm-gray hover:text-gold transition-colors">Terms of Service</a>
                <a href="#" className="text-warm-gray hover:text-gold transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
