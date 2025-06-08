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
import TempLogin from "@/pages/temp-login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/signup" component={Signup} />
          <Route path="/shop" component={Shop} />
          <Route path="/products" component={Products} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/corporate-registration" component={CorporateRegistration} />
          <Route path="/corporate-benefits" component={CorporateBenefits} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/products" component={Products} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/admin" component={Admin} />
          <Route path="/custom-jewelry" component={CustomJewelry} />
          <Route path="/ai-tryon" component={AITryOn} />
          <Route path="/gullak" component={Gullak} />
          <Route path="/gullak/create" component={CreateGullakEnhanced} />
          <Route path="/loyalty" component={Loyalty} />
          <Route path="/shingaar-guru" component={ShingaarGuru} />
          <Route path="/jewelry-care" component={JewelryCare} />
          <Route path="/jewelry-exchange" component={JewelryExchange} />
          <Route path="/currency-converter" component={CurrencyConverter} />
          <Route path="/corporate-registration" component={CorporateRegistration} />
          <Route path="/corporate-benefits" component={CorporateBenefits} />
          <Route path="/corporate-admin" component={CorporateAdmin} />
        </>
      )}
      <Route path="/temp-login" component={TempLogin} />
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
