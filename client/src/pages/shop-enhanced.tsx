import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";

import { Search, Filter, Grid3X3, List, SlidersHorizontal, Crown, Gem, Sparkles, ArrowUpDown } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  sortOrder?: number;
  products?: Product[];
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  productType: "real" | "imitation";
  material?: string;
  weight?: number;
  purity?: string;
  isFeatured?: boolean;
};

export default function ShopEnhanced() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<string>("all");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white via-white to-amber-50/20 flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-12 w-12 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading jewelry collection...</p>
        </div>
      </div>
    );
  }

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
    
    const matchesPriceRange = priceRange === "all" || 
      (priceRange === "under-10000" && product.price < 10000) ||
      (priceRange === "10000-50000" && product.price >= 10000 && product.price <= 50000) ||
      (priceRange === "50000-100000" && product.price >= 50000 && product.price <= 100000) ||
      (priceRange === "above-100000" && product.price > 100000);

    return matchesSearch && matchesCategory && matchesProductType && matchesPriceRange;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "featured":
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white via-white to-amber-50/20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
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

              {/* Additional Filters */}
              <div className="mt-6 pt-6 border-t border-amber-200 dark:border-gray-600 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Product Type
                  </label>
                  <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="real">Real Jewelry</SelectItem>
                      <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Price Range
                  </label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-10000">Under ₹10,000</SelectItem>
                      <SelectItem value="10000-50000">₹10,000 - ₹50,000</SelectItem>
                      <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                      <SelectItem value="above-100000">Above ₹1,00,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Main Shopping Area */}
            <div className="flex-1 space-y-6">
              {/* Search and Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-100 dark:border-gray-700 p-4">
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

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              {(selectedParentCategory !== "all" || selectedCategory !== "all") && (
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => {
                        setSelectedParentCategory("all");
                        setSelectedCategory("all");
                      }}
                      className="px-3 py-1 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
              )}

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {sortedProducts.length} of {products.length} products
                  {searchTerm && ` for "${searchTerm}"`}
                </span>
              </div>

              {/* Products Grid/List */}
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
                  {sortedProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}