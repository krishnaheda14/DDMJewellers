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

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  categoryId: number;
  imageUrl?: string;
  images?: string[];
  material?: string;
  weight?: string;
  dimensions?: string;
  inStock: boolean;
  featured: boolean;
  customizable: boolean;
  customizationOptions?: any;
  productType: "real" | "imitation";
  plating?: string;
  baseMaterial?: string;
  category?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("all");
  
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

  // Get main categories only
  const mainCategories = categories.filter(cat => !cat.parentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Get subcategories for selected parent
  const subcategories = selectedParentCategory !== "all" 
    ? categories.filter(cat => cat.parentId === parseInt(selectedParentCategory)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  // Filter products based on search, category, and product type
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (product.material?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesCategory = selectedCategory === "all" || 
                           product.categoryId === parseInt(selectedCategory);
    
    const matchesProductType = selectedProductType === "all" || 
                              product.productType === selectedProductType;
    
    const matchesPrice = priceRange === "all" || 
                        (priceRange === "under-5000" && parseFloat(product.price) < 5000) ||
                        (priceRange === "5000-15000" && parseFloat(product.price) >= 5000 && parseFloat(product.price) <= 15000) ||
                        (priceRange === "15000-50000" && parseFloat(product.price) >= 15000 && parseFloat(product.price) <= 50000) ||
                        (priceRange === "above-50000" && parseFloat(product.price) > 50000);
    
    return matchesSearch && matchesCategory && matchesProductType && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "featured":
      default:
        return b.featured ? 1 : -1;
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

          {/* Search and Filters */}
          <div className="space-y-6">
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
              
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedParentCategory} onValueChange={(value) => {
                  setSelectedParentCategory(value);
                  setSelectedCategory("all"); // Reset subcategory when parent changes
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Main Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Main Categories</SelectItem>
                    {mainCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {subcategories.length > 0 && (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcategories</SelectItem>
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
            
            {/* Visual Category Browser */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-amber-600" />
                Browse by Category
              </h3>
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
                {mainCategories.map((category: Category) => (
                  <Button
                    key={category.id}
                    variant={selectedParentCategory === category.id.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedParentCategory(category.id.toString());
                      setSelectedCategory("all");
                    }}
                    className="h-auto p-3 flex flex-col items-center justify-center gap-2 min-h-[80px]"
                  >
                    <Gem className="h-5 w-5" />
                    <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                  </Button>
                ))}
              </div>
              
              {/* Subcategory Browser */}
              {subcategories.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">
                    {mainCategories.find(cat => cat.id.toString() === selectedParentCategory)?.name} Subcategories:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="h-auto p-2 text-xs"
                    >
                      All Items
                    </Button>
                    {subcategories.map((category: Category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id.toString() ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id.toString())}
                        className="h-auto p-2 text-xs text-left"
                      >
                        {category.name}
                      </Button>
                    ))}
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
                          <ProductCard key={product.id} product={product} />
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
                    <ProductCard key={product.id} product={product} />
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
                    <ProductCard key={product.id} product={product} />
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
                    <ProductCard key={product.id} product={product} />
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
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}