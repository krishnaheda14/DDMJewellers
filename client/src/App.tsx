import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";

// Eager load critical components
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";

// Lazy load non-critical components
const EnhancedChatbot = lazy(() => import("@/components/enhanced-chatbot"));
const Products = lazy(() => import("@/pages/products"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Cart = lazy(() => import("@/pages/cart"));
const Admin = lazy(() => import("@/pages/admin"));
const CustomJewelry = lazy(() => import("@/pages/custom-jewelry"));
const AITryOn = lazy(() => import("@/pages/ai-tryon"));
const Gullak = lazy(() => import("@/pages/gullak"));
const CreateGullakEnhanced = lazy(() => import("@/pages/gullak-create-enhanced"));
const Loyalty = lazy(() => import("@/pages/loyalty"));
const ShingaarGuru = lazy(() => import("@/pages/shingaar-guru"));
const JewelryCare = lazy(() => import("@/pages/jewelry-care"));
const JewelryExchange = lazy(() => import("@/pages/jewelry-exchange"));
const ImitationJewelry = lazy(() => import("@/pages/imitation-jewelry"));
const CurrencyConverter = lazy(() => import("@/pages/currency-converter"));
const CorporateRegistration = lazy(() => import("@/pages/corporate-registration"));
const CorporateBenefits = lazy(() => import("@/pages/corporate-benefits"));
const CorporateAdmin = lazy(() => import("@/pages/corporate-admin"));
const Shop = lazy(() => import("@/pages/shop-enhanced"));
const LiveMarketRates = lazy(() => import("@/pages/live-market-rates"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminCategories = lazy(() => import("@/pages/admin-categories"));
const EnhancedAdminDashboard = lazy(() => import("@/pages/enhanced-admin-dashboard"));
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const WholesalerDashboard = lazy(() => import("@/pages/wholesaler-dashboard"));
const OfflineSalesManagement = lazy(() => import("@/pages/offline-sales-management"));
const StockManagement = lazy(() => import("@/pages/stock-management"));
const DayBook = lazy(() => import("@/pages/day-book"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Always accessible routes */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/signup" component={AuthPage} />
        <Route path="/shop" component={Shop} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/corporate-registration" component={CorporateRegistration} />
        <Route path="/corporate-benefits" component={CorporateBenefits} />
        <Route path="/live-market-rates" component={LiveMarketRates} />
        <Route path="/currency-converter" component={CurrencyConverter} />
        <Route path="/jewelry-care" component={JewelryCare} />
        <Route path="/imitation-jewelry" component={ImitationJewelry} />
        <Route path="/ai-tryon" component={AITryOn} />
        <Route path="/custom-jewelry" component={CustomJewelry} />
        <Route path="/shingaar-guru" component={ShingaarGuru} />
        
        {/* Authentication-based routes */}
        <Route path="/" component={isAuthenticated ? Home : Landing} />
        <Route path="/cart" component={isAuthenticated ? Cart : AuthPage} />
        <Route path="/admin" component={isAuthenticated ? Admin : AuthPage} />
        <Route path="/admin/categories" component={isAuthenticated ? AdminCategories : AuthPage} />
        <Route path="/admin/dashboard" component={isAuthenticated ? EnhancedAdminDashboard : AuthPage} />
        <Route path="/customer/dashboard" component={isAuthenticated ? CustomerDashboard : AuthPage} />
        <Route path="/wholesaler/dashboard" component={isAuthenticated ? WholesalerDashboard : AuthPage} />
        <Route path="/gullak" component={isAuthenticated ? Gullak : AuthPage} />
        <Route path="/gullak/create" component={isAuthenticated ? CreateGullakEnhanced : AuthPage} />
        <Route path="/loyalty" component={isAuthenticated ? Loyalty : AuthPage} />
        <Route path="/jewelry-exchange" component={isAuthenticated ? JewelryExchange : AuthPage} />
        <Route path="/corporate-admin" component={isAuthenticated ? CorporateAdmin : AuthPage} />
        <Route path="/admin/offline-sales" component={isAuthenticated ? OfflineSalesManagement : AuthPage} />
        <Route path="/admin/stock-management" component={isAuthenticated ? StockManagement : AuthPage} />
        <Route path="/admin/day-book" component={isAuthenticated ? DayBook : AuthPage} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Suspense fallback={null}>
          <EnhancedChatbot />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
