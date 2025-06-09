import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, ShoppingCart, Star } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "list";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to your cart.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const handleProductClick = () => {
    navigate(`/products/${product.id}`);
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  if (variant === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="flex" onClick={handleProductClick}>
          <div className="w-48 h-48 flex-shrink-0 relative overflow-hidden">
            <img
              src={product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {hasDiscount && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                {discountPercentage}% OFF
              </Badge>
            )}
            {product.featured && (
              <Badge className="absolute top-2 right-2 bg-gold text-white">
                Featured
              </Badge>
            )}
          </div>
          
          <CardContent className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-deep-navy mb-2 hover:text-gold transition-colors">
                {product.name}
              </h3>
              <p className="text-warm-gray mb-4 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
                <span className="text-sm text-warm-gray ml-2">(4.8/5)</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-gold">
                  ₹{parseFloat(product.price).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-warm-gray line-through">
                    ₹{parseFloat(product.originalPrice!).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {product.material && (
                <p className="text-sm text-warm-gray mb-2">Material: {product.material}</p>
              )}
              {product.weight && (
                <p className="text-sm text-warm-gray mb-2">Weight: {product.weight}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-gold hover:bg-gold/90 text-white"
                onClick={handleAddToCart}
                disabled={!product.inStock || addToCartMutation.isPending}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
              <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="relative overflow-hidden" onClick={handleProductClick}>
        <div className="aspect-square overflow-hidden">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white">
              {discountPercentage}% OFF
            </Badge>
          )}
          {product.featured && (
            <Badge className="bg-gold text-white">
              Featured
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white text-deep-navy shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-6" onClick={handleProductClick}>
        <h3 className="text-xl font-semibold text-deep-navy mb-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <p className="text-warm-gray mb-4 line-clamp-2">{product.description}</p>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-gold text-gold" />
          ))}
          <span className="text-sm text-warm-gray ml-2">(4.8/5)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold text-gold">
            ₹{parseFloat(product.price).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-lg text-warm-gray line-through">
              ₹{parseFloat(product.originalPrice!).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          className="w-full bg-gold hover:bg-gold/90 text-white"
          onClick={handleAddToCart}
          disabled={!product.inStock || addToCartMutation.isPending}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {addToCartMutation.isPending ? "Adding..." : !product.inStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
