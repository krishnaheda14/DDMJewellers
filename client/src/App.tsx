import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import EnhancedChatbot from "@/components/enhanced-chatbot";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Admin from "@/pages/admin";
import CustomJewelry from "@/pages/custom-jewelry";
import AITryOn from "@/pages/ai-tryon";
import Gullak from "@/pages/gullak";
import CreateGullakEnhanced from "@/pages/gullak-create-enhanced";
import Loyalty from "@/pages/loyalty";
import ShingaarGuru from "@/pages/shingaar-guru";
import JewelryCare from "@/pages/jewelry-care";
import JewelryExchange from "@/pages/jewelry-exchange";
import CurrencyConverter from "@/pages/currency-converter";
import CorporateRegistration from "@/pages/corporate-registration";
import CorporateBenefits from "@/pages/corporate-benefits";
import CorporateAdmin from "@/pages/corporate-admin";
import Shop from "@/pages/shop";
import AuthPage from "@/pages/auth-page";
import LiveMarketRates from "@/pages/live-market-rates";
import AdminDashboard from "@/pages/admin-dashboard";
import CustomerDashboard from "@/pages/customer-dashboard";
import WholesalerDashboard from "@/pages/wholesaler-dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Always accessible routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={Signup} />
      <Route path="/shop" component={Shop} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/corporate-registration" component={CorporateRegistration} />
      <Route path="/corporate-benefits" component={CorporateBenefits} />
      <Route path="/live-market-rates" component={LiveMarketRates} />
      <Route path="/currency-converter" component={CurrencyConverter} />
      <Route path="/jewelry-care" component={JewelryCare} />
      <Route path="/ai-tryon" component={AITryOn} />
      <Route path="/custom-jewelry" component={CustomJewelry} />
      <Route path="/shingaar-guru" component={ShingaarGuru} />
      
      {/* Authentication-based routes */}
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/cart" component={isAuthenticated ? Cart : AuthPage} />
      <Route path="/admin" component={isAuthenticated ? Admin : AuthPage} />
      <Route path="/admin/dashboard" component={isAuthenticated ? AdminDashboard : AuthPage} />
      <Route path="/customer/dashboard" component={isAuthenticated ? CustomerDashboard : AuthPage} />
      <Route path="/wholesaler/dashboard" component={isAuthenticated ? WholesalerDashboard : AuthPage} />
      <Route path="/gullak" component={isAuthenticated ? Gullak : AuthPage} />
      <Route path="/gullak/create" component={isAuthenticated ? CreateGullakEnhanced : AuthPage} />
      <Route path="/loyalty" component={isAuthenticated ? Loyalty : AuthPage} />
      <Route path="/jewelry-exchange" component={isAuthenticated ? JewelryExchange : AuthPage} />
      <Route path="/corporate-admin" component={isAuthenticated ? CorporateAdmin : AuthPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <EnhancedChatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
