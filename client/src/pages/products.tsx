import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid, List } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [featured, setFeatured] = useState<boolean | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('categoryId');
    const featuredParam = urlParams.get('featured');

    if (searchParam) setSearch(searchParam);
    if (categoryParam) setCategoryId(parseInt(categoryParam));
    if (featuredParam === 'true') setFeatured(true);
  }, [location]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products?${new URLSearchParams({
      ...(search && { search }),
      ...(categoryId && { categoryId: categoryId.toString() }),
      ...(featured !== undefined && { featured: featured.toString() })
    }).toString()}`],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setCategoryId(undefined);
    } else {
      setCategoryId(parseInt(value));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setFeatured(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="bg-cream-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-deep-navy mb-4">
              Our Jewelry Collection
            </h1>
            <p className="text-xl text-warm-gray max-w-2xl mx-auto">
              Discover exquisite pieces crafted with passion and precision
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-warm-gray" />
                <Input
                  type="text"
                  placeholder="Search jewelry..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryId?.toString() || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
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

              {/* Featured Filter */}
              <Button
                variant={featured ? "default" : "outline"}
                onClick={() => setFeatured(featured ? undefined : true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Featured
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              {/* Clear Filters */}
              {(search || categoryId || featured) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}

              {/* View Mode Toggle */}
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

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {search}
                <button onClick={() => setSearch("")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {categoryId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categories.find(c => c.id === categoryId)?.name}
                <button onClick={() => setCategoryId(undefined)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {featured && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Featured
                <button onClick={() => setFeatured(undefined)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <p className="text-warm-gray">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                  : "space-y-6"
              }>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    variant={viewMode}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-2">No products found</h3>
              <p className="text-warm-gray mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
