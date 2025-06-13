import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ShoppingCart, Star, Filter, Search, Sparkles, Crown, Gem } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  material: string;
  plating?: string;
  baseMaterial?: string;
  productType: "real" | "imitation";
  categoryId: number;
  category?: {
    name: string;
  };
  featured: boolean;
  inStock: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productType: "real" | "imitation" | "both";
}

export default function ImitationJewelryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  // Fetch imitation jewelry categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", "imitation"],
    queryFn: async () => {
      const response = await fetch("/api/categories?productType=imitation");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch imitation jewelry products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "imitation", selectedCategory, searchTerm, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        productType: "imitation",
        ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { sortBy }),
      });
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const filteredProducts = products.filter(product => {
    if (priceRange === "all") return true;
    const price = parseFloat(product.price);
    switch (priceRange) {
      case "under-500":
        return price < 500;
      case "500-1000":
        return price >= 500 && price <= 1000;
      case "1000-2000":
        return price >= 1000 && price <= 2000;
      case "above-2000":
        return price > 2000;
      default:
        return true;
    }
  });

  const featuredCategories = [
    {
      name: "Necklaces",
      description: "Elegant imitation necklaces with premium plating",
      icon: Crown,
      count: products.filter(p => p.category?.name.toLowerCase().includes("necklace")).length,
      image: "/api/placeholder/300/200"
    },
    {
      name: "Earrings",
      description: "Beautiful earrings in gold and silver plating",
      icon: Sparkles,
      count: products.filter(p => p.category?.name.toLowerCase().includes("earring")).length,
      image: "/api/placeholder/300/200"
    },
    {
      name: "Rings",
      description: "Stylish rings with durable base materials",
      icon: Gem,
      count: products.filter(p => p.category?.name.toLowerCase().includes("ring")).length,
      image: "/api/placeholder/300/200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white via-white to-amber-50/20">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gold via-amber-500 to-rose-gold text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-cream-white bg-clip-text text-transparent">
              Imitation Jewelry Collection
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-cream-white/90">
              Discover our exquisite collection of premium imitation jewelry crafted with finest materials and elegant plating
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Gold Plated
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Silver Plated
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Rose Gold
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Premium Quality
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-bronze-dark">
          Featured Categories
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-gold/20 bg-white/90 backdrop-blur-sm hover:bg-cream-white/95">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className="h-8 w-8 text-gold" />
                    <Badge variant="outline" className="text-xs border-gold/30 text-bronze-dark">
                      {category.count} items
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-bronze-dark">
                    {category.name}
                  </h3>
                  <p className="text-bronze/70 mb-4 text-sm">
                    {category.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-gold/30 text-bronze-dark hover:bg-gold hover:text-white transition-colors"
                    onClick={() => setSelectedCategory(category.name.toLowerCase())}
                  >
                    Explore {category.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters and Products */}
      <div className="container mx-auto px-4 pb-16">
        {/* Search and Filter Bar */}
        <div className="bg-white/90 border border-gold/20 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bronze" />
              <Input
                placeholder="Search jewelry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gold/30 bg-white/95 focus:border-gold"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-gold/30 bg-white/95">
                <SelectValue placeholder="Category" />
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

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="border-gold/30 bg-white/95">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-500">Under ₹500</SelectItem>
                <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                <SelectItem value="1000-2000">₹1,000 - ₹2,000</SelectItem>
                <SelectItem value="above-2000">Above ₹2,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="border-gold/30 bg-white/95">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-gold hover:bg-amber-600 text-white border-0">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border border-gold/20 bg-white/95 hover:bg-cream-white/98 backdrop-blur-sm overflow-hidden">
                <div className="relative overflow-hidden">
                  <img
                    src={product.imageUrl || "/api/placeholder/300/300"}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-gold text-white">
                      Featured
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button size="icon" variant="ghost" className="bg-white/80 hover:bg-white border-gold/20">
                      <Heart className="h-4 w-4 text-bronze" />
                    </Button>
                  </div>
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-bronze-dark mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.plating && (
                      <Badge variant="outline" className="text-xs border-gold/30 text-bronze">
                        {product.plating}
                      </Badge>
                    )}
                    {product.baseMaterial && (
                      <Badge variant="outline" className="text-xs border-gold/30 text-bronze">
                        {product.baseMaterial}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gold">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-bronze/60 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                      <span className="text-sm text-bronze">4.5</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gold hover:bg-amber-600 text-white border-0"
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Link href={`/product/${product.id}`}>
                      <Button size="sm" variant="outline" className="px-3 border-gold/30 text-bronze hover:bg-gold hover:text-white">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-bronze/60 mb-4">
              <Gem className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-bronze-dark mb-2">
              No products found
            </h3>
            <p className="text-bronze/70">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}