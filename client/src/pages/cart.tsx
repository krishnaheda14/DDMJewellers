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
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";

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

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await apiRequest("POST", "/api/orders", {
        shippingAddress,
        orderItems,
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
  const total = subtotal + shipping;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Shopping Cart</h1>
          <p className="text-warm-gray mt-2">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-deep-navy mb-4">Your cart is empty</h2>
            <p className="text-warm-gray mb-8">
              Discover our beautiful jewelry collection and add items to your cart.
            </p>
            <Button 
              size="lg"
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-deep-navy">{item.product.name}</h3>
                        <p className="text-sm text-warm-gray">{item.product.description}</p>
                        <p className="text-lg font-bold text-gold">
                          ₹{parseFloat(item.product.price).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({ 
                              id: item.id, 
                              quantity: Math.max(1, item.quantity - 1) 
                            })}
                            disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                            className="px-2"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
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
  );
}
