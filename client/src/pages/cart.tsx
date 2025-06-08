import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Home, ArrowLeft, Gift, Upload, Camera } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";
import { CartLoader, SubmissionLoader } from "@/components/loading/jewelry-loader";
import { CardReveal, PageTransition } from "@/components/loading/page-transition";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Cart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  const [exchangeData, setExchangeData] = useState({
    enabled: false,
    jewelryType: "",
    weight: "",
    purity: "",
    estimatedValue: 0,
    jewelryPhotoUrl: "",
    billPhotoUrl: "",
    description: "",
    appraisalId: null as number | null,
  });

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your cart.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    },
  });

  const submitExchangeMutation = useMutation({
    mutationFn: async (exchangeData: any) => {
      return apiRequest("POST", "/api/jewelry-exchange", exchangeData);
    },
    onSuccess: (data) => {
      setExchangeData(prev => ({ 
        ...prev, 
        appraisalId: data.id,
        estimatedValue: data.estimatedValue || 0
      }));
      toast({
        title: "Exchange request submitted",
        description: "Your jewelry exchange request has been submitted for appraisal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit exchange request.",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await apiRequest("POST", "/api/orders", {
        shippingAddress,
        orderItems,
        exchangeData: exchangeData.enabled ? exchangeData : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Order placed!",
        description: "Your order has been placed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const subtotal = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  const shipping = subtotal > 25000 ? 0 : 500;
  const exchangeDiscount = exchangeData.enabled ? exchangeData.estimatedValue : 0;
  const total = Math.max(0, subtotal + shipping - exchangeDiscount);

  const handleCheckout = () => {
    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping address fields.",
        variant: "destructive",
      });
      return;
    }
    checkoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <CartLoader />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Navigation Header */}
        <div className="bg-white border-b py-4">
          <div className="container-fluid">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
              >
                <Home className="h-4 w-4" />
                DDM Jewellers
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container-fluid p-responsive-sm">
        <div className="m-responsive-sm">
          <h1 className="heading-lg text-deep-navy">Shopping Cart</h1>
          <p className="responsive-text-sm text-warm-gray mt-2">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center p-responsive-sm">
            <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-gray-300 m-responsive-sm" />
            <h2 className="heading-md text-deep-navy m-responsive-sm">Your cart is empty</h2>
            <p className="responsive-text-sm text-warm-gray m-responsive-sm">
              Discover our beautiful jewelry collection and add items to your cart.
            </p>
            <Button 
              size="lg"
              className="bg-gold hover:bg-gold/90 text-white btn-responsive touch-friendly"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-responsive">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="card-responsive">
                  <CardContent className="responsive-card-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                          alt={item.product.name}
                          className="responsive-image"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h3 className="heading-sm text-deep-navy">{item.product.name}</h3>
                        <p className="text-responsive-xs text-warm-gray">{item.product.description}</p>
                        <p className="responsive-text text-gold font-bold">
                          ₹{parseFloat(item.product.price).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 justify-between sm:justify-start">
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({ 
                              id: item.id, 
                              quantity: Math.max(1, item.quantity - 1) 
                            })}
                            disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                            className="touch-friendly px-2 sm:px-2"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-2 text-responsive-xs font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({ 
                              id: item.id, 
                              quantity: item.quantity + 1 
                            })}
                            disabled={updateQuantityMutation.isPending}
                            className="px-2"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary and Checkout */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN')}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-sm text-green-600">
                      Free shipping on orders over ₹25,000!
                    </p>
                  )}
                  {exchangeData.enabled && exchangeDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Exchange Discount</span>
                      <span>-₹{exchangeDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-gold">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter your address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="Postal Code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jewelry Exchange Option */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-600" />
                    Jewelry Exchange
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="exchangeEnabled"
                      checked={exchangeData.enabled}
                      onChange={(e) => setExchangeData(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="exchangeEnabled" className="text-sm">
                      I want to exchange old jewelry for discount
                    </Label>
                  </div>

                  {exchangeData.enabled && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="jewelryType">Jewelry Type</Label>
                          <Input
                            id="jewelryType"
                            value={exchangeData.jewelryType}
                            onChange={(e) => setExchangeData(prev => ({ ...prev, jewelryType: e.target.value }))}
                            placeholder="Ring, Necklace, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight">Weight (grams)</Label>
                          <Input
                            id="weight"
                            value={exchangeData.weight}
                            onChange={(e) => setExchangeData(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="e.g., 10.5"
                            type="number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="purity">Purity</Label>
                        <Input
                          id="purity"
                          value={exchangeData.purity}
                          onChange={(e) => setExchangeData(prev => ({ ...prev, purity: e.target.value }))}
                          placeholder="22K, 18K, 916, etc."
                        />
                      </div>

                      <div>
                        <Label htmlFor="jewelryPhotoUrl">Jewelry Photo URL</Label>
                        <Input
                          id="jewelryPhotoUrl"
                          value={exchangeData.jewelryPhotoUrl}
                          onChange={(e) => setExchangeData(prev => ({ ...prev, jewelryPhotoUrl: e.target.value }))}
                          placeholder="Upload photo and paste URL"
                        />
                        {exchangeData.jewelryPhotoUrl && (
                          <div className="mt-2">
                            <img 
                              src={exchangeData.jewelryPhotoUrl} 
                              alt="Jewelry" 
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="billPhotoUrl">Original Bill Photo URL</Label>
                        <Input
                          id="billPhotoUrl"
                          value={exchangeData.billPhotoUrl}
                          onChange={(e) => setExchangeData(prev => ({ ...prev, billPhotoUrl: e.target.value }))}
                          placeholder="Upload bill photo and paste URL"
                        />
                        {exchangeData.billPhotoUrl && (
                          <div className="mt-2">
                            <img 
                              src={exchangeData.billPhotoUrl} 
                              alt="Bill" 
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="exchangeDescription">Description</Label>
                        <Input
                          id="exchangeDescription"
                          value={exchangeData.description}
                          onChange={(e) => setExchangeData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your jewelry (stones, condition, etc.)"
                        />
                      </div>

                      {!exchangeData.appraisalId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!exchangeData.jewelryType || !exchangeData.weight || !exchangeData.purity) {
                              toast({
                                title: "Missing information",
                                description: "Please fill in jewelry type, weight, and purity.",
                                variant: "destructive",
                              });
                              return;
                            }
                            submitExchangeMutation.mutate({
                              jewelryType: exchangeData.jewelryType,
                              weight: exchangeData.weight,
                              purity: exchangeData.purity,
                              jewelryPhotoUrl: exchangeData.jewelryPhotoUrl,
                              billPhotoUrl: exchangeData.billPhotoUrl,
                              description: exchangeData.description,
                            });
                          }}
                          disabled={submitExchangeMutation.isPending}
                          className="w-full"
                        >
                          {submitExchangeMutation.isPending ? "Submitting..." : "Submit for Appraisal"}
                          <Camera className="h-4 w-4 ml-2" />
                        </Button>
                      )}

                      {exchangeData.appraisalId && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            ✓ Exchange request submitted! Estimated value: ₹{exchangeData.estimatedValue.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            This discount will be applied to your order total.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full bg-gold hover:bg-gold/90 text-white"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Processing..." : "Place Order"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate("/products")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
}
