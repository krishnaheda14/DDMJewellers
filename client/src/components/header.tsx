import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CartSidebar from "./cart-sidebar";
import { Search, ShoppingBag, User, Menu, X, Heart, Home, Trophy, Sparkles } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Header() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cartItems = [] } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Collections", href: "/products" },
    { name: "Gullak", href: "/gullak" },
    { name: "Shingaar Guru", href: "/shingaar-guru", icon: Sparkles },
    { name: "Custom Design", href: "/custom-jewelry" },
    { name: "Virtual Try-On", href: "/ai-tryon" },
    { name: "Rings", href: "/products?search=ring" },
    { name: "Necklaces", href: "/products?search=necklace" },
    { name: "Earrings", href: "/products?search=earring" },
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-white via-amber-50/30 to-white shadow-lg backdrop-blur-sm sticky top-0 z-50 border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Top Bar - Hidden on mobile for space optimization */}
          <div className="hidden sm:block border-b border-gradient-to-r from-transparent via-gold/30 to-transparent py-2">
            <div className="flex justify-between items-center text-xs sm:text-sm text-warm-gray">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="relative group">
                  <span className="relative z-10 truncate">Free Shipping on Orders Above ₹25,000</span>
                  <div className="absolute inset-0 bg-gold/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-sm"></div>
                </span>
                <span className="hidden md:inline text-gold/50">|</span>
                <span className="hidden lg:inline hover:text-gold transition-colors duration-200">Call: +91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <a href="#" className="relative group hover:text-gold transition-all duration-300 transform hover:scale-105 hidden sm:block">
                  <span className="relative z-10">Track Order</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#" className="relative group hover:text-gold transition-all duration-300 transform hover:scale-105 hidden md:block">
                  <span className="relative z-10">Store Locator</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></div>
                </a>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button onClick={() => navigate("/")} className="text-left group relative transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-amber-100/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                <div className="relative z-10 p-1 sm:p-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-deep-navy">
                    <span className="text-gold drop-shadow-sm bg-gradient-to-r from-gold to-amber-600 bg-clip-text text-transparent">DDM</span> 
                    <span className="ml-1 bg-gradient-to-r from-deep-navy to-slate-700 bg-clip-text text-transparent">Jewellers</span>
                  </h1>
                  <p className="text-xs text-warm-gray -mt-1 group-hover:text-gold/70 transition-colors duration-300 hidden sm:block">Since 1985</p>
                </div>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gold to-amber-500 group-hover:w-full transition-all duration-500"></div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-2">
              {navigationItems.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="relative group px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:shadow-md"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-50/50 to-gold/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {item.icon && (
                    <item.icon className="h-4 w-4 text-deep-navy group-hover:text-gold transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 relative z-10" />
                  )}
                  <span className="text-deep-navy group-hover:text-gold transition-all duration-300 relative z-10 font-medium">
                    {item.name}
                  </span>
                  
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-gold to-amber-500 group-hover:w-3/4 transition-all duration-300 transform -translate-x-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-300 to-gold group-hover:w-1/2 transition-all duration-500 transform -translate-x-1/2 delay-100"></div>
                </button>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative hidden lg:block group">
                <div className="relative overflow-hidden rounded-lg">
                  <Input
                    type="text"
                    placeholder="Search jewelry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 xl:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white group-hover:shadow-md"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-warm-gray group-hover:text-gold transition-colors duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"></div>
                </div>
              </form>

              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden relative group touch-target text-warm-gray hover:text-gold transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                onClick={() => navigate("/products")}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-amber-100/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Button>

              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative group touch-target text-warm-gray hover:text-gold transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:scale-110 transition-all duration-300 group-hover:fill-red-400 group-hover:text-red-400" />
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 via-red-50/30 to-gold/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 delay-100"></div>
                  </Button>

                  {/* Loyalty Program */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative group p-2 text-warm-gray hover:text-gold transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                    onClick={() => navigate("/loyalty")}
                  >
                    <Trophy className="h-5 w-5 transform group-hover:scale-110 transition-all duration-300 group-hover:text-yellow-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/20 via-gold/10 to-amber-50/30 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  </Button>

                  {/* Cart */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative group touch-target text-warm-gray hover:text-gold transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                    onClick={() => setIsCartOpen(true)}
                  >
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-3" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-50/50 to-gold/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-gold to-amber-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-2">
                    {user?.isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin")}
                        className="hidden sm:flex relative group border-gold/30 text-gold hover:bg-gold hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-amber-100/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                        <span className="relative z-10">Admin</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative group p-2 text-warm-gray hover:text-gold flex items-center gap-2 transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                    >
                      <User className="h-5 w-5 transform group-hover:scale-110 transition-all duration-300" />
                      <span className="hidden sm:inline relative z-10">
                        {user?.firstName || user?.email || "Account"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-50/50 to-gold/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      className="hidden sm:flex relative group text-warm-gray hover:text-red-500 transition-all duration-300 rounded-lg hover:bg-red-50 hover:shadow-md transform hover:scale-105"
                    >
                      <span className="relative z-10">Logout</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-red-100/30 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  className="relative group bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  onClick={() => window.location.href = "/api/login"}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <User className="h-4 w-4 mr-2 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden relative group p-2 text-warm-gray hover:text-gold transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-amber-100/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                {isMenuOpen ? (
                  <X className="h-5 w-5 relative z-10 transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-90" />
                ) : (
                  <Menu className="h-5 w-5 relative z-10 transform group-hover:scale-110 transition-all duration-300" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative md:hidden">
                  <Input
                    type="text"
                    placeholder="Search jewelry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-warm-gray" />
                </form>

                {/* Mobile Navigation */}
                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setIsMenuOpen(false);
                      }}
                      className="text-left text-deep-navy hover:text-gold font-medium transition-colors py-2 flex items-center gap-2"
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.name}
                    </button>
                  ))}
                </nav>

                {/* Mobile User Actions */}
                {isAuthenticated && (
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                    {user?.isAdmin && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                        className="text-left text-deep-navy hover:text-gold font-medium transition-colors py-2"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = "/api/logout"}
                      className="text-left text-deep-navy hover:text-gold font-medium transition-colors py-2"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
