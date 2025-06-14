import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Eye, Sparkles } from "lucide-react";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProductQuickView } from "./ProductQuickView";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add to cart", variant: "destructive" });
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wishlist", {
        productId: product.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Added to wishlist!" });
    },
    onError: () => {
      toast({ title: "Failed to add to wishlist", variant: "destructive" });
    },
  });

  return (
    <>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white dark:bg-gray-800 ${className}`}>
        <CardContent className="p-0">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-700 dark:to-gray-600">
            <img
              src={product.imageUrl || '/api/placeholder/300/300'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                onClick={() => setIsQuickViewOpen(true)}
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Quick View 360°
              </Button>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isFeatured && (
                <Badge className="bg-amber-500 text-white shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {product.material && (
                <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-md">
                  {product.material}
                </Badge>
              )}
            </div>

            {/* Wishlist button */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addToWishlistMutation.mutate();
                }}
                disabled={addToWishlistMutation.isPending}
                className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Heart className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 mb-1">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price and specifications */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {product.price ? formatPrice(product.price) : 'Price on request'}
              </div>
              
              {(product.weight || product.size) && (
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {product.weight && (
                    <span>Weight: {product.weight}g</span>
                  )}
                  {product.size && (
                    <span>Size: {product.size}</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCartMutation.mutate();
                  }}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sign in to Buy
                </Button>
              )}
              
              <Button
                onClick={() => setIsQuickViewOpen(true)}
                variant="outline"
                size="sm"
                className="px-3 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}