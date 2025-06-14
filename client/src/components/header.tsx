import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CartSidebar from "./cart-sidebar";
import { useCurrencyContext } from "@/components/price-display";
import { Search, ShoppingBag, User, Menu, X, Heart, Home, Trophy, Sparkles, Globe, DollarSign } from "lucide-react";
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
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { selectedCurrency, changeCurrency } = useCurrencyContext();

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

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  ];

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Gullak", href: "/gullak" },
    { name: "Shingaar Guru", href: "/shingaar-guru", icon: Sparkles },
    { name: "Jewelry Care", href: "/jewelry-care" },
    { name: "Currency Converter", href: "/currency-converter" },
    { name: "Custom Design", href: "/custom-jewelry" },
    { name: "Virtual Try-On", href: "/ai-tryon" },
    { name: "Corporate Benefits", href: "/corporate-benefits" },
    { name: "Corporate Partnership", href: "/corporate-registration" },
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-white via-amber-50/30 to-white shadow-lg backdrop-blur-sm sticky top-0 z-50 border-b border-gold/20 safe-area-top">
        <div className="container-fluid">
          {/* Top Bar - Hidden on mobile for space optimization */}
          <div className="hidden sm:block border-b border-gradient-to-r from-transparent via-gold/30 to-transparent py-2">
            <div className="flex justify-between items-center text-responsive-xs text-warm-gray">
              <div className="flex items-center gap-responsive-sm">
                <span className="relative group">
                  <span className="relative z-10 truncate">Free Shipping on Orders Above ₹25,000</span>
                  <div className="absolute inset-0 bg-gold/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-sm"></div>
                </span>
                <span className="hidden md:inline text-gold/50">|</span>
                <span className="hidden lg:inline hover:text-gold transition-colors duration-200">Call: +91 98765 43210</span>
              </div>
              <div className="flex items-center gap-responsive-sm">
                <a href="#" className="relative group hover:text-gold transition-all duration-300 transform hover:scale-105 hidden sm:block">
                  <span className="relative z-10">Track Order</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></div>
                </a>
                
                {/* Language Selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1 hover:text-gold hover:bg-gold/10 text-xs">
                      <Globe className="w-3 h-3" />
                      <span>{languages.find(lang => lang.code === selectedLanguage)?.flag}</span>
                      <span className="hidden lg:inline">{languages.find(lang => lang.code === selectedLanguage)?.name}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">Select Language</p>
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => setSelectedLanguage(language.code)}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-gold/10 transition-colors ${
                            selectedLanguage === language.code ? 'bg-gold/20 text-gold font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>{language.flag}</span>
                          <span>{language.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Currency Selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1 hover:text-gold hover:bg-gold/10 text-xs">
                      <DollarSign className="w-3 h-3" />
                      <span>{currencies.find(curr => curr.code === selectedCurrency)?.symbol}</span>
                      <span className="hidden lg:inline">{selectedCurrency}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">Select Currency</p>
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => changeCurrency(currency.code)}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-gold/10 transition-colors ${
                            selectedCurrency === currency.code ? 'bg-gold/20 text-gold font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>{currency.symbol}</span>
                          <span>{currency.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Link href="/store-locator" className="relative group hover:text-gold transition-all duration-300 transform hover:scale-105 hidden lg:block">
                  <span className="relative z-10">Store Locator</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></div>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Enhanced DDM Jewellers Logo */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => navigate("/")} 
                className="text-left group relative transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50 rounded-lg"
                aria-label="DDM Jewellers - Go to Home"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-50/20 to-silver-light/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg"></div>
                <div className="relative z-10 p-2 sm:p-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                    <span className="text-gold drop-shadow-lg bg-gradient-to-r from-gold via-amber-500 to-gold bg-clip-text text-transparent font-extrabold">DDM</span> 
                    <span className="ml-2 bg-gradient-to-r from-silver-dark via-gray-700 to-deep-navy bg-clip-text text-transparent font-bold">Jewellers</span>
                  </h1>
                  <div className="flex items-center gap-2 -mt-1">
                    <p className="text-xs text-warm-gray group-hover:text-gold/80 transition-colors duration-300 font-medium">Since 1985</p>
                    <div className="hidden sm:flex items-center gap-1">
                      <div className="w-1 h-1 bg-gold rounded-full animate-pulse"></div>
                      <span className="text-xs text-gold font-medium">Premium Quality</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-gold via-amber-500 to-silver group-hover:w-full transition-all duration-500 rounded-full"></div>
              </button>
            </div>

            {/* Desktop Navigation with Horizontal Scrolling */}
            <nav className="hidden lg:block max-w-2xl xl:max-w-4xl overflow-hidden">
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide hover:scrollbar-show pb-1 scroll-smooth">
                {navigationItems.map((item, index) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className="relative group px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:shadow-md flex-shrink-0 whitespace-nowrap"
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
              </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (user?.role === 'customer') {
                          navigate('/customer/dashboard');
                        } else if (user?.role === 'wholesaler') {
                          navigate('/wholesaler/dashboard');
                        } else if (user?.role === 'admin') {
                          navigate('/admin/dashboard');
                        }
                      }}
                      className="relative group p-2 text-warm-gray hover:text-gold flex items-center gap-2 transition-all duration-300 rounded-lg hover:bg-gold/10 hover:shadow-md transform hover:scale-105"
                    >
                      <User className="h-5 w-5 transform group-hover:scale-110 transition-all duration-300" />
                      <span className="hidden sm:inline relative z-10">
                        {user?.role === 'admin' ? 'Profile' : user?.firstName || user?.email || "Account"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-50/50 to-gold/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiRequest("POST", "/api/auth/signout");
                          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                          window.location.href = "/";
                        } catch (error) {
                          console.error("Logout failed:", error);
                        }
                      }}
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
                  onClick={() => window.location.href = "/auth"}
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

                {/* Mobile Language and Currency Selectors */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-4">
                    {/* Mobile Language Selector */}
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue>
                            <span className="flex items-center gap-1">
                              <span>{languages.find(lang => lang.code === selectedLanguage)?.flag}</span>
                              <span>{languages.find(lang => lang.code === selectedLanguage)?.name}</span>
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              <span className="flex items-center gap-2">
                                <span>{language.flag}</span>
                                <span>{language.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mobile Currency Selector */}
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Currency</label>
                      <Select value={selectedCurrency} onValueChange={changeCurrency}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue>
                            <span className="flex items-center gap-1">
                              <span>{currencies.find(curr => curr.code === selectedCurrency)?.symbol}</span>
                              <span>{selectedCurrency}</span>
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              <span className="flex items-center gap-2">
                                <span>{currency.symbol}</span>
                                <span>{currency.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Mobile User Actions */}
                {isAuthenticated && (
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                    {user?.role === 'admin' && (
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
