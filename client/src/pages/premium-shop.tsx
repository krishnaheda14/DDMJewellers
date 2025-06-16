import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart,
  ShoppingCart,
  Eye,
  Star,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  imageUrls?: string[];
  categoryId: number;
  productType: "real" | "imitation";
  material?: string;
  weight?: number;
  purity?: string;
  isFeatured?: boolean;
  stock?: number;
  tags?: string[];
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  sortOrder?: number;
  productType?: string;
};

export default function PremiumShop() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [selectedPurity, setSelectedPurity] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Extract unique materials and purities from products
  const uniqueMaterials = useMemo(() => {
    const materials = products
      .map(p => p.material)
      .filter(Boolean)
      .filter((material, index, arr) => arr.indexOf(material) === index);
    return materials;
  }, [products]);

  const uniquePurities = useMemo(() => {
    const purities = products
      .map(p => p.purity)
      .filter(Boolean)
      .filter((purity, index, arr) => arr.indexOf(purity) === index);
    return purities;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === "all" || 
        product.categoryId === parseInt(selectedCategory);

      // Product type filter
      const matchesProductType = selectedProductType === "all" || 
        product.productType === selectedProductType;

      // Material filter
      const matchesMaterial = selectedMaterial.length === 0 || 
        (product.material && selectedMaterial.includes(product.material));

      // Purity filter
      const matchesPurity = selectedPurity.length === 0 || 
        (product.purity && selectedPurity.includes(product.purity));

      // Price filter
      const price = parseFloat(product.price) || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesProductType && 
             matchesMaterial && matchesPurity && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price_high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return b.id - a.id;
        case "featured":
        default:
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.id - a.id;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedProductType, selectedMaterial, selectedPurity, priceRange, sortBy]);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMaterial([]);
    setSelectedProductType("all");
    setSelectedPurity([]);
    setPriceRange([0, 500000]);
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedProductType !== "all" ? selectedProductType : null,
    selectedMaterial.length > 0 ? selectedMaterial : null,
    selectedPurity.length > 0 ? selectedPurity : null,
    priceRange[0] > 0 || priceRange[1] < 500000 ? priceRange : null
  ].filter(Boolean).length;

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <Sparkles className="inline w-8 h-8 text-amber-600 mr-2" />
                Jewelry Collection
              </h1>
              <p className="text-gray-600">Discover our exquisite range of fine jewelry</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jewelry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1 bg-gray-50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'} w-80 space-y-6`}>
            <Card className="p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              {/* Product Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Product Type</Label>
                <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="real">Real Jewelry</SelectItem>
                    <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              {/* Material Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Material</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueMaterials.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material}`}
                        checked={selectedMaterial.includes(material)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMaterial([...selectedMaterial, material]);
                          } else {
                            setSelectedMaterial(selectedMaterial.filter(m => m !== material));
                          }
                        }}
                      />
                      <Label htmlFor={`material-${material}`} className="text-sm">
                        {material}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Purity Filter */}
              {selectedProductType !== "imitation" && (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Purity</Label>
                    <div className="space-y-2">
                      {uniquePurities.map((purity) => (
                        <div key={purity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`purity-${purity}`}
                            checked={selectedPurity.includes(purity)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPurity([...selectedPurity, purity]);
                              } else {
                                setSelectedPurity(selectedPurity.filter(p => p !== purity));
                              }
                            }}
                          />
                          <Label htmlFor={`purity-${purity}`} className="text-sm">
                            {purity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* Price Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>₹0</span>
                  <span>₹5,00,000</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Products Area */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <p className="text-gray-600">
                  {filteredProducts.length} products found
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <div className="relative">
                      {/* Product Image */}
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {product.imageUrl || (product.imageUrls && product.imageUrls.length > 0) ? (
                          <img
                            src={product.imageUrl || product.imageUrls?.[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isFeatured && (
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant="secondary" className="capitalize">
                          {product.productType}
                        </Badge>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''
                            }`} 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/products/${product.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </h3>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xl font-bold text-amber-600">
                              ₹{parseFloat(product.price).toLocaleString()}
                            </p>
                            {product.material && (
                              <p className="text-xs text-gray-500">
                                {product.material}
                                {product.purity && ` • ${product.purity}`}
                                {product.weight && ` • ${product.weight}g`}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button 
                          className="w-full mt-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}