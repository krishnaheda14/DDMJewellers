import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProductCardComponent } from "@/components/ProductCard";
import { Search, Filter, Grid, List, ArrowUpDown, SlidersHorizontal, Crown, Gem, Sparkles, Home } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  productType?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: string;
  categoryId: number;
  imageUrl?: string;
  material?: string;
  weight?: string;
  productType: "real" | "imitation";
  featured?: boolean;
};

export default function Shop() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all"); // Gold/Silver/Diamond
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all"); // Neck/Ear/Hand
  const [selectedSpecificType, setSelectedSpecificType] = useState<string>("all"); // Chain/Choker/etc
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<string>("all");

  const { toast } = useToast();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Three-level hierarchy categories
  const materialCategories = categories.filter(cat => !cat.parentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const bodyPartCategories = selectedMaterial !== "all" 
    ? categories.filter(cat => cat.parentId === parseInt(selectedMaterial)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];
    
  const specificTypeCategories = selectedBodyPart !== "all"
    ? categories.filter(cat => cat.parentId === parseInt(selectedBodyPart)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  // Filter products based on hierarchical selection
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (product.material?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Three-level category filtering
    let matchesCategory = true;
    if (selectedSpecificType !== "all") {
      matchesCategory = product.categoryId === parseInt(selectedSpecificType);
    } else if (selectedBodyPart !== "all") {
      const specificTypes = categories.filter(cat => cat.parentId === parseInt(selectedBodyPart));
      const specificTypeIds = specificTypes.map(cat => cat.id);
      matchesCategory = specificTypeIds.includes(product.categoryId) || product.categoryId === parseInt(selectedBodyPart);
    } else if (selectedMaterial !== "all") {
      const bodyParts = categories.filter(cat => cat.parentId === parseInt(selectedMaterial));
      const bodyPartIds = bodyParts.map(cat => cat.id);
      const allSubcategoryIds = categories.filter(cat => bodyPartIds.includes(cat.parentId || 0)).map(cat => cat.id);
      matchesCategory = bodyPartIds.includes(product.categoryId) || allSubcategoryIds.includes(product.categoryId) || product.categoryId === parseInt(selectedMaterial);
    }

    const matchesProductType = selectedProductType === "all" || product.productType === selectedProductType;
    
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
      case "price-low": return parseFloat(a.price) - parseFloat(b.price);
      case "price-high": return parseFloat(b.price) - parseFloat(a.price);
      case "name": return a.name.localeCompare(b.name);
      case "newest": return new Date(b.id).getTime() - new Date(a.id).getTime();
      case "featured":
      default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const resetFilters = () => {
    setSelectedMaterial("all");
    setSelectedBodyPart("all");
    setSelectedSpecificType("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Jewelry Collection
            </h1>
            <p className="text-xl text-amber-100 max-w-2xl mx-auto">
              Discover our exquisite collection of gold, silver, and diamond jewelry
            </p>
          </div>

          {/* Hierarchical Category Selectors */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jewelry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {/* Material Category (Level 1) */}
                <Select value={selectedMaterial} onValueChange={(value) => {
                  setSelectedMaterial(value);
                  setSelectedBodyPart("all");
                  setSelectedSpecificType("all");
                }}>
                  <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Material Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    {materialCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Body Part Category (Level 2) */}
                {bodyPartCategories.length > 0 && (
                  <Select value={selectedBodyPart} onValueChange={(value) => {
                    setSelectedBodyPart(value);
                    setSelectedSpecificType("all");
                  }}>
                    <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Body Part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Body Parts</SelectItem>
                      {bodyPartCategories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Specific Type Category (Level 3) */}
                {specificTypeCategories.length > 0 && (
                  <Select value={selectedSpecificType} onValueChange={setSelectedSpecificType}>
                    <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Specific Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {specificTypeCategories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="real">Real Jewelry</SelectItem>
                    <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedMaterial !== "all" || selectedBodyPart !== "all" || selectedSpecificType !== "all") && (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Active Filters:</span>
                    
                    {selectedMaterial !== "all" && (
                      <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                        {materialCategories.find(cat => cat.id.toString() === selectedMaterial)?.name}
                      </Badge>
                    )}
                    
                    {selectedBodyPart !== "all" && (
                      <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                        {bodyPartCategories.find(cat => cat.id.toString() === selectedBodyPart)?.name}
                      </Badge>
                    )}
                    
                    {selectedSpecificType !== "all" && (
                      <Badge variant="default" className="bg-amber-600 text-white">
                        {specificTypeCategories.find(cat => cat.id.toString() === selectedSpecificType)?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-white hover:bg-white/10"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products ({sortedProducts.length})
          </h2>
          
          <div className="flex gap-2">
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

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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
              <ProductCardComponent key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}