import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Star, 
  Heart, 
  ShoppingCart, 
  Grid3X3, 
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Gem,
  Crown,
  Sparkles,
  Home,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageNavigation from "@/components/page-navigation";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@shared/schema";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number;
  productType?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt: string;
  children?: Category[];
}

export default function Shop() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading: productsLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Process categories into hierarchical structure
  const processedCategories = categories.reduce((acc, category) => {
    if (!category.parentId) {
      // Main category
      acc.push({
        ...category,
        children: categories.filter(c => c.parentId === category.id).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      });
    }
    return acc;
  }, [] as Category[]).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Three-level hierarchy: Material Type (Gold/Silver) → Body Part → Specific Type
  const mainCategories = categories.filter(cat => !cat.parentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  // Get subcategories for selected parent (Body Parts for Gold, or specific types for Body Parts)
  const subcategories = selectedParentCategory !== "all" 
    ? categories.filter(cat => cat.parentId === parseInt(selectedParentCategory)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  // Filter products based on search, category, and product type
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (product.material?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    // Three-level hierarchy filtering: Gold → Neck Jewelry → Chain/Choker
    let matchesCategory = true;
    if (selectedCategory !== "all") {
      // Specific subcategory selected (e.g., Chain, Choker)
      matchesCategory = product.categoryId === parseInt(selectedCategory);
    } else if (selectedParentCategory !== "all") {
      // Main category selected (e.g., Gold Jewellery) - show all products from its subcategories
      const directSubcategories = categories.filter(cat => cat.parentId === parseInt(selectedParentCategory));
      const directSubcategoryIds = directSubcategories.map(cat => cat.id);
      
      // Also get products from third-level categories (e.g., Chain under Neck Jewelry under Gold)
      const thirdLevelIds = categories
        .filter(cat => directSubcategoryIds.includes(cat.parentId || 0))
        .map(cat => cat.id);
        
      matchesCategory = 
        directSubcategoryIds.includes(product.categoryId) || 
        thirdLevelIds.includes(product.categoryId) ||
        product.categoryId === parseInt(selectedParentCategory);
    }
    
    const matchesProductType = selectedProductType === "all" || 
                              product.productType === selectedProductType;
    
    const matchesPrice = priceRange === "all" || 
                        (priceRange === "under-5000" && product.price && parseFloat(product.price) < 5000) ||
                        (priceRange === "5000-15000" && product.price && parseFloat(product.price) >= 5000 && parseFloat(product.price) <= 15000) ||
                        (priceRange === "15000-50000" && product.price && parseFloat(product.price) >= 15000 && parseFloat(product.price) <= 50000) ||
                        (priceRange === "above-50000" && product.price && parseFloat(product.price) > 50000);
    
    return matchesSearch && matchesCategory && matchesProductType && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    switch (sortBy) {
      case "price-low":
        return (a.price ? parseFloat(a.price) : 0) - (b.price ? parseFloat(b.price) : 0);
      case "price-high":
        return (b.price ? parseFloat(b.price) : 0) - (a.price ? parseFloat(a.price) : 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      case "featured":
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  // Group products by category for category view
  const productsByCategory = categories.map((category: Category) => ({
    ...category,
    products: sortedProducts.filter((product: Product) => product.categoryId === category.id)
  }));

  const handleAddToCart = async (productId: number) => {
    try {
      await apiRequest("POST", "/api/cart", {
        productId,
        quantity: 1
      });
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    try {
      await apiRequest("POST", "/api/wishlist", {
        productId,
        type: "product"
      });
      toast({
        title: "Added to Wishlist",
        description: "Product has been added to your wishlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ProductCardComponent = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="relative overflow-hidden">
        <img
          src={product.imageUrl || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {product.featured && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {product.customizable && (
            <Badge variant="outline" className="bg-white/90">
              <Sparkles className="h-3 w-3 mr-1" />
              Customizable
            </Badge>
          )}
        </div>
        <div className="absolute top-2 left-2">
          {product.originalPrice && (
            <Badge variant="destructive" className="bg-red-500">
              {Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)}% OFF
            </Badge>
          )}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAddToWishlist(product.id)}
              className="bg-white/90 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddToCart(product.id)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-lg hover:text-amber-600 transition-colors cursor-pointer line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {product.material && (
              <p className="text-xs text-gray-500">Material: {product.material}</p>
            )}
            <Badge 
              variant={product.productType === "real" ? "default" : "secondary"}
              className={product.productType === "real" ? "bg-emerald-100 text-emerald-800 text-xs" : "bg-purple-100 text-purple-800 text-xs"}
            >
              {product.productType === "real" ? "Real Jewelry" : "Imitation"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-amber-600">₹{parseFloat(product.price).toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">₹{parseFloat(product.originalPrice).toLocaleString()}</span>
              )}
            </div>
            {!product.inStock && (
              <Badge variant="outline" className="text-red-500 border-red-500">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <Card className="flex overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={product.imageUrl || "/api/placeholder/200/200"}
        alt={product.name}
        className="w-32 h-32 object-cover"
      />
      <CardContent className="flex-1 p-4">
        <div className="flex justify-between items-start h-full">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-lg hover:text-amber-600 transition-colors cursor-pointer">
                  {product.name}
                </h3>
              </Link>
              <div className="flex gap-1">
                {product.featured && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Featured
                  </Badge>
                )}
                {product.customizable && (
                  <Badge variant="outline">Customizable</Badge>
                )}
                <Badge 
                  variant={product.productType === "real" ? "default" : "secondary"}
                  className={product.productType === "real" ? "bg-emerald-100 text-emerald-800 text-xs" : "bg-purple-100 text-purple-800 text-xs"}
                >
                  {product.productType === "real" ? "Real" : "Imitation"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
            {product.material && (
              <p className="text-xs text-gray-500">Material: {product.material}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-600">₹{parseFloat(product.price).toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">₹{parseFloat(product.originalPrice).toLocaleString()}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddToWishlist(product.id)}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddToCart(product.id)}
              disabled={!product.inStock}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white via-white to-amber-50/20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <PageNavigation />
        <div className="max-w-7xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Gem className="h-8 w-8 text-amber-600" />
                Jewelry Collection
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Discover our exquisite range of handcrafted jewelry
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex gap-6">
            {/* Category Filter Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-amber-100 dark:border-gray-700 p-6 h-fit">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Browse Categories
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedParentCategory("all");
                    setSelectedCategory("all");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedParentCategory === "all" 
                      ? "bg-amber-600 text-white" 
                      : "hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  All Categories
                </button>
                
                {mainCategories.map((mainCat: Category) => (
                  <div key={mainCat.id} className="border-l-2 border-amber-200 dark:border-amber-600 pl-2">
                    <button
                      onClick={() => {
                        setSelectedParentCategory(mainCat.id.toString());
                        setSelectedCategory("all");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedParentCategory === mainCat.id.toString()
                          ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-medium" 
                          : "hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {mainCat.name === "Gold Jewellery" && <Gem className="h-4 w-4 text-yellow-500" />}
                      {mainCat.name === "Silver Jewellery" && <Sparkles className="h-4 w-4 text-gray-400" />}
                      {mainCat.name === "Diamond Jewellery" && <Crown className="h-4 w-4 text-blue-400" />}
                      {mainCat.name}
                    </button>
                    
                    {selectedParentCategory === mainCat.id.toString() && subcategories.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1 border-l border-amber-200 dark:border-amber-600 pl-3">
                        {subcategories.map((subCat: Category) => (
                          <button
                            key={subCat.id}
                            onClick={() => setSelectedCategory(subCat.id.toString())}
                            className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                              selectedCategory === subCat.id.toString()
                                ? "bg-amber-600 text-white" 
                                : "hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {subCat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Shopping Area */}
            <div className="flex-1 space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jewelry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              
              {/* Category Breadcrumb Navigation */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <Crown className="h-5 w-5 text-amber-600" />
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => {
                      setSelectedParentCategory("all");
                      setSelectedCategory("all");
                    }}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      selectedParentCategory === "all" 
                        ? "bg-amber-600 text-white" 
                        : "bg-white text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    All Categories
                  </button>
                  
                  {selectedParentCategory !== "all" && (
                    <>
                      <span className="text-amber-400">→</span>
                      <span className="px-3 py-1 bg-amber-600 text-white rounded-full">
                        {mainCategories.find(cat => cat.id.toString() === selectedParentCategory)?.name}
                      </span>
                    </>
                  )}
                  
                  {selectedCategory !== "all" && subcategories.length > 0 && (
                    <>
                      <span className="text-amber-400">→</span>
                      <span className="px-3 py-1 bg-amber-700 text-white rounded-full">
                        {subcategories.find(cat => cat.id.toString() === selectedCategory)?.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={selectedParentCategory} onValueChange={(value) => {
                  setSelectedParentCategory(value);
                  setSelectedCategory("all");
                }}>
                  <SelectTrigger className="w-48 border-amber-200 focus:border-amber-500">
                    <Filter className="h-4 w-4 mr-2 text-amber-600" />
                    <SelectValue placeholder="Material Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    {mainCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          {category.name === "Gold Jewellery" && <Gem className="h-4 w-4 text-yellow-500" />}
                          {category.name === "Silver Jewellery" && <Sparkles className="h-4 w-4 text-gray-400" />}
                          {category.name === "Diamond Jewellery" && <Crown className="h-4 w-4 text-blue-400" />}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {subcategories.length > 0 && (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-52 border-amber-200 focus:border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
                      <SlidersHorizontal className="h-4 w-4 mr-2 text-amber-600" />
                      <SelectValue placeholder="Body Part / Specific Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {subcategories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

              <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="real">Real Jewelry</SelectItem>
                  <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-5000">Under ₹5,000</SelectItem>
                  <SelectItem value="5000-15000">₹5,000 - ₹15,000</SelectItem>
                  <SelectItem value="15000-50000">₹15,000 - ₹50,000</SelectItem>
                  <SelectItem value="above-50000">Above ₹50,000</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters Display */}
            {(selectedParentCategory !== "all" || selectedCategory !== "all") && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-300">Active Filters:</span>
                    
                    {selectedParentCategory !== "all" && (
                      <Badge variant="outline" className="bg-white border-amber-300 text-amber-700">
                        {mainCategories.find(cat => cat.id.toString() === selectedParentCategory)?.name}
                      </Badge>
                    )}
                    
                    {selectedCategory !== "all" && (
                      <Badge variant="default" className="bg-amber-600 text-white">
                        {subcategories.find(cat => cat.id.toString() === selectedCategory)?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedParentCategory("all");
                      setSelectedCategory("all");
                    }}
                    className="h-auto p-1 text-amber-700 hover:text-amber-900"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    All Categories
                  </Button>
                  <span className="text-amber-600">/</span>
                  <span className="font-medium text-amber-800">
                    {mainCategories.find(cat => cat.id.toString() === selectedParentCategory)?.name}
                  </span>
                  {selectedCategory !== "all" && (
                    <>
                      <span className="text-amber-600">/</span>
                      <span className="font-medium text-amber-900">
                        {subcategories.find(cat => cat.id.toString() === selectedCategory)?.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Category Browser with Clear Division */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Shop by Category
                </h3>
                <p className="text-amber-100 text-sm mt-1">Choose a main category to explore subcategories</p>
              </div>
              
              <div className="p-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <div className="h-1 w-6 bg-amber-600 rounded"></div>
                  Main Categories by Body Parts
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <Button
                  variant={selectedParentCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedParentCategory("all");
                    setSelectedCategory("all");
                  }}
                  className="h-auto p-3 flex flex-col items-center justify-center gap-2 min-h-[80px]"
                >
                  <Crown className="h-5 w-5" />
                  <span className="text-xs font-medium">All Categories</span>
                </Button>
                {mainCategories.map((category: Category) => {
                  const categoryProductCount = products.filter((p: Product) => p.categoryId === category.id).length;
                  const subcategoryCount = categories.filter((c: Category) => c.parentId === category.id).length;
                  
                  return (
                    <Button
                      key={category.id}
                      variant={selectedParentCategory === category.id.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedParentCategory(category.id.toString());
                        setSelectedCategory("all");
                      }}
                      className="h-auto p-3 flex flex-col items-center justify-center gap-2 min-h-[90px] relative"
                    >
                      <Gem className="h-5 w-5" />
                      <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                        <span>{categoryProductCount} items</span>
                        {subcategoryCount > 0 && <span>• {subcategoryCount} types</span>}
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {/* Enhanced Subcategory Browser */}
              {subcategories.length > 0 && (
                <div className="mt-6 pt-6 border-t border-amber-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 bg-amber-600 rounded"></div>
                    <h4 className="font-semibold text-base text-gray-800 dark:text-gray-200">
                      {mainCategories.find(cat => cat.id.toString() === selectedParentCategory)?.name} Subcategories
                    </h4>
                    <div className="h-1 flex-1 bg-amber-100 rounded"></div>
                  </div>
                  <div className="bg-amber-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className="h-auto p-3 flex flex-col items-center gap-2 min-h-[60px] bg-white dark:bg-gray-800"
                      >
                        <Crown className="h-4 w-4" />
                        <span className="text-xs font-medium">All Items</span>
                      </Button>
                      {subcategories.map((category: Category) => {
                        const subcategoryProductCount = products.filter((p: Product) => p.categoryId === category.id).length;
                        
                        return (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id.toString())}
                            className="h-auto p-3 flex flex-col items-center gap-2 min-h-[70px] bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 border-l-4 border-l-amber-200"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{subcategoryProductCount} items</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              All Products ({sortedProducts.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              By Category
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Gem className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {sortedProducts.map((product: Product) => 
                  viewMode === "grid" ? (
                    <ProductCard key={product.id} product={product} />
                  ) : (
                    <ProductListItem key={product.id} product={product} />
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="space-y-12">
              {/* Category Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Gem className="h-6 w-6 text-amber-600" />
                  Browse by Category
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {processedCategories.map((mainCategory) => (
                    <div key={mainCategory.id} className="space-y-3">
                      <div 
                        className="font-semibold text-lg text-amber-700 dark:text-amber-400 cursor-pointer hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                        onClick={() => {
                          setSelectedParentCategory(mainCategory.id.toString());
                          setSelectedCategory("all");
                        }}
                      >
                        {mainCategory.name}
                      </div>
                      {mainCategory.children && mainCategory.children.length > 0 && (
                        <div className="space-y-1 ml-3">
                          {mainCategory.children.slice(0, 6).map((subCategory) => (
                            <div 
                              key={subCategory.id}
                              className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              onClick={() => {
                                setSelectedParentCategory(mainCategory.id.toString());
                                setSelectedCategory(subCategory.id.toString());
                              }}
                            >
                              • {subCategory.name}
                            </div>
                          ))}
                          {mainCategory.children.length > 6 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{mainCategory.children.length - 6} more...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Products by Category */}
              {productsByCategory.map((category: Category & { products: Product[] }) => (
                category.products.length > 0 && (
                  <div key={category.id}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {category.products.length} items
                      </Badge>
                    </div>
                    <div className={
                      viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    }>
                      {category.products.map((product: Product) => 
                        viewMode === "grid" ? (
                          <ProductCardComponent key={product.id} product={product} />
                        ) : (
                          <ProductListItem key={product.id} product={product} />
                        )
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collections">
            <div className="space-y-8">
              {/* Featured Collection */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-8 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Royal Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Exquisite handcrafted pieces for special occasions
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.filter(p => p.name.toLowerCase().includes('gold') || p.name.toLowerCase().includes('diamond')).slice(0, 4).map((product: Product) => (
                    <ProductCardComponent key={product.id} product={product} />
                  ))}
                </div>
              </div>

              {/* Bridal Collection */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-8 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Bridal Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Perfect jewelry for your special day
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.filter(p => p.name.toLowerCase().includes('necklace') || p.name.toLowerCase().includes('set')).slice(0, 4).map((product: Product) => (
                    <ProductCardComponent key={product.id} product={product} />
                  ))}
                </div>
              </div>

              {/* Contemporary Collection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Contemporary Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Modern designs for everyday elegance
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.filter(p => p.name.toLowerCase().includes('bracelet') || p.name.toLowerCase().includes('ring')).slice(0, 4).map((product: Product) => (
                    <ProductCardComponent key={product.id} product={product} />
                  ))}
                </div>
              </div>

              {/* Festive Collection */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Festive Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Celebrate traditions with timeless pieces
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.filter(p => p.name.toLowerCase().includes('emerald') || p.name.toLowerCase().includes('ruby')).slice(0, 4).map((product: Product) => (
                    <ProductCardComponent key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}