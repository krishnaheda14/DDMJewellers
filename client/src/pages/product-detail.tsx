import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import JewelryCustomizer from "@/components/jewelry-customizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, ShoppingCart, Star, Shield, Truck, RotateCcw, ArrowLeft } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<any>({});
  const [additionalPrice, setAdditionalPrice] = useState(0);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: parseInt(id!),
        quantity,
        customizations: Object.keys(customizations).length > 0 ? customizations : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart.`,
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
          window.location.href = "/api/login";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-deep-navy mb-4">Product not found</h1>
            <Button onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <nav className="bg-cream-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => navigate("/")}
              className="text-warm-gray hover:text-gold transition-colors"
            >
              Home
            </button>
            <span className="text-warm-gray">/</span>
            <button 
              onClick={() => navigate("/products")}
              className="text-warm-gray hover:text-gold transition-colors"
            >
              Products
            </button>
            <span className="text-warm-gray">/</span>
            <span className="text-deep-navy font-medium">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg border">
                <img
                  src={images[selectedImage] || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded border-2 transition-colors ${
                        selectedImage === index ? "border-gold" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-deep-navy mb-2">{product.name}</h1>
                {product.featured && (
                  <Badge className="bg-gold text-white mb-4">Featured</Badge>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gold">
                      ₹{parseFloat(product.price).toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-warm-gray line-through">
                        ₹{parseFloat(product.originalPrice!).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <Badge variant="destructive">
                      {discountPercentage}% OFF
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4 fill-gold text-gold" 
                    />
                  ))}
                  <span className="text-sm text-warm-gray ml-2">(4.8/5 based on 24 reviews)</span>
                </div>
              </div>

              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-2">Description</h3>
                  <p className="text-warm-gray leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-deep-navy">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.material && (
                    <div>
                      <span className="font-medium text-deep-navy">Material:</span>
                      <span className="text-warm-gray ml-2">{product.material}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <span className="font-medium text-deep-navy">Weight:</span>
                      <span className="text-warm-gray ml-2">{product.weight}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <span className="font-medium text-deep-navy">Dimensions:</span>
                      <span className="text-warm-gray ml-2">{product.dimensions}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-deep-navy">Availability:</span>
                    <span className={`ml-2 ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-deep-navy">Quantity:</label>
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-x">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-gold hover:bg-gold/90 text-white"
                    onClick={() => addToCartMutation.mutate()}
                    disabled={!product.inStock || addToCartMutation.isPending}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button size="lg" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-cream-white rounded-lg">
                  <Shield className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-deep-navy">Authentic</p>
                    <p className="text-xs text-warm-gray">Certified Quality</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-cream-white rounded-lg">
                  <Truck className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-deep-navy">Free Shipping</p>
                    <p className="text-xs text-warm-gray">On orders over ₹25,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-cream-white rounded-lg">
                  <RotateCcw className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-deep-navy">30-Day Returns</p>
                    <p className="text-xs text-warm-gray">Hassle-free returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
