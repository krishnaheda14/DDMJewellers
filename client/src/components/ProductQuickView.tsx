import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart, RotateCw, ZoomIn, ZoomOut, Move3D } from "lucide-react";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 360 rotation state
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const autoRotateInterval = useRef<NodeJS.Timeout>();

  // Generate multiple angles for 360 view (simulate multiple product shots)
  const generate360Images = (baseImage: string) => {
    const angles = [];
    for (let i = 0; i < 36; i++) {
      angles.push(`${baseImage}?angle=${i * 10}&rotation=${i}`);
    }
    return angles;
  };

  const productImages = product ? generate360Images(product.imageUrl || '/api/placeholder/400/400') : [];

  // Auto rotation effect
  useEffect(() => {
    if (isAutoRotating) {
      autoRotateInterval.current = setInterval(() => {
        setRotation(prev => (prev + 10) % 360);
        setCurrentImageIndex(prev => (prev + 1) % productImages.length);
      }, 100);
    } else {
      if (autoRotateInterval.current) {
        clearInterval(autoRotateInterval.current);
      }
    }
    
    return () => {
      if (autoRotateInterval.current) {
        clearInterval(autoRotateInterval.current);
      }
    };
  }, [isAutoRotating, productImages.length]);

  // Mouse drag handlers for manual rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - dragStart;
    const newRotation = (rotation + diff * 0.5) % 360;
    setRotation(newRotation);
    setCurrentImageIndex(Math.floor((newRotation / 360) * productImages.length));
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
    setIsAutoRotating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const diff = e.touches[0].clientX - dragStart;
    const newRotation = (rotation + diff * 0.5) % 360;
    setRotation(newRotation);
    setCurrentImageIndex(Math.floor((newRotation / 360) * productImages.length));
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  // Reset view
  const resetView = () => {
    setRotation(0);
    setZoom(1);
    setCurrentImageIndex(0);
    setIsAutoRotating(false);
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");
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
      if (!product) throw new Error("No product selected");
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

  if (!product) return null;

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 360 Product Viewer */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-0">
                <div
                  ref={imageRef}
                  className="relative aspect-square cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    transform: `scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease'
                  }}
                >
                  <img
                    src={productImages[currentImageIndex] || product.imageUrl || '/api/placeholder/400/400'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease'
                    }}
                  />
                  
                  {/* 360 Indicator */}
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <Move3D className="w-4 h-4" />
                    360° View
                  </div>

                  {/* Rotation angle indicator */}
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {Math.round(rotation)}°
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={isAutoRotating ? "bg-amber-100 dark:bg-amber-900" : ""}
              >
                <RotateCw className={`w-4 h-4 mr-2 ${isAutoRotating ? 'animate-spin' : ''}`} />
                {isAutoRotating ? 'Stop' : 'Auto Rotate'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4 mr-2" />
                Zoom In
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4 mr-2" />
                Zoom Out
              </Button>
              
              <Button variant="outline" size="sm" onClick={resetView}>
                Reset View
              </Button>
            </div>

            {/* Drag instruction */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Click and drag to rotate • Pinch to zoom on mobile
            </p>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {product.featured ? 'Featured' : 'Standard'}
                </Badge>
                {product.material && (
                  <Badge variant="outline">
                    {product.material}
                  </Badge>
                )}
              </div>
              
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-4">
                {formatPrice(product.price)}
              </div>

              {product.description && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Product Specifications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.weight && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="ml-2 font-medium">{product.weight}g</span>
                  </div>
                )}
                {product.material && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Material:</span>
                    <span className="ml-2 font-medium">{product.material}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                    <span className="ml-2 font-medium">{product.dimensions}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                  <span className="ml-2 font-medium">DDM-{product.id}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {user ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => addToCartMutation.mutate()}
                    disabled={addToCartMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => addToWishlistMutation.mutate()}
                    disabled={addToWishlistMutation.isPending}
                    className="px-4"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Sign in to Purchase
                </Button>
              )}
            </div>

            {/* Additional Features */}
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Why Choose DDM Jewellers?</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Certified authentic jewelry</li>
                  <li>• 30-day return guarantee</li>
                  <li>• Free shipping on orders above ₹5,000</li>
                  <li>• Lifetime maintenance service</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}