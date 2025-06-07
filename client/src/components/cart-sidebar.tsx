import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated && isOpen,
  });

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

  const subtotal = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  const shipping = subtotal > 25000 ? 0 : 500;
  const total = subtotal + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    navigate("/cart");
  };

  const handleContinueShopping = () => {
    onClose();
    navigate("/products");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart ({itemCount})</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 space-y-4 pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Your cart is empty</h3>
            <p className="text-warm-gray mb-6">Add some beautiful jewelry to get started.</p>
            <Button 
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-4 group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-deep-navy text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-warm-gray line-clamp-1 mt-1">
                      {item.product.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-gold">
                        ₹{parseFloat(item.product.price).toLocaleString('en-IN')}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantityMutation.mutate({ 
                            id: item.id, 
                            quantity: Math.max(1, item.quantity - 1) 
                          })}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantityMutation.mutate({ 
                            id: item.id, 
                            quantity: item.quantity + 1 
                          })}
                          disabled={updateQuantityMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Cart Summary */}
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString('en-IN')}`}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600">
                    Free shipping on orders over ₹25,000!
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-gold">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-gold hover:bg-gold/90 text-white"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
