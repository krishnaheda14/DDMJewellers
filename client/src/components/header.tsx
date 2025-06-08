import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CartSidebar from "./cart-sidebar";
import { Search, ShoppingBag, User, Menu, X, Heart, Home } from "lucide-react";
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
    { name: "Custom Design", href: "/custom-jewelry" },
    { name: "Virtual Try-On", href: "/ai-tryon" },
    { name: "Rings", href: "/products?search=ring" },
    { name: "Necklaces", href: "/products?search=necklace" },
    { name: "Earrings", href: "/products?search=earring" },
  ];

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="border-b border-gray-100 py-2">
            <div className="flex justify-between items-center text-sm text-warm-gray">
              <div className="flex items-center space-x-4">
                <span>Free Shipping on Orders Above ₹25,000</span>
                <span className="hidden md:inline">|</span>
                <span className="hidden md:inline">Call: +91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:text-gold transition-colors">Track Order</a>
                <a href="#" className="hover:text-gold transition-colors">Store Locator</a>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button onClick={() => navigate("/")} className="text-left hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold text-deep-navy">
                  <span className="text-gold">DDM</span> Jewellers
                </h1>
                <p className="text-xs text-warm-gray -mt-1">Since 1985</p>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="text-deep-navy hover:text-gold font-medium transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Search jewelry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-warm-gray" />
              </form>

              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 text-warm-gray hover:text-gold"
                onClick={() => navigate("/products")}
              >
                <Search className="h-5 w-5" />
              </Button>

              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-warm-gray hover:text-gold transition-colors relative"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>

                  {/* Cart */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-warm-gray hover:text-gold transition-colors relative"
                    onClick={() => setIsCartOpen(true)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-gold text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
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
                        className="hidden sm:flex"
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-warm-gray hover:text-gold flex items-center gap-2"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline">
                        {user?.firstName || user?.email || "Account"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      className="hidden sm:flex text-warm-gray hover:text-gold"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  className="bg-gold hover:bg-gold/90 text-white"
                  onClick={() => window.location.href = "/api/login"}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 text-warm-gray hover:text-gold"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                      className="text-left text-deep-navy hover:text-gold font-medium transition-colors py-2"
                    >
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
