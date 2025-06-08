import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid, List, Home } from "lucide-react";
import type { Product, Category } from "@shared/schema";
import { ProductLoader } from "@/components/loading/jewelry-loader";
import { CardReveal, StaggeredList } from "@/components/loading/page-transition";

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
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      <section className="bg-cream-white p-responsive-sm">
        <div className="container-fluid">
          <div className="text-center">
            <h1 className="heading-lg text-deep-navy m-responsive-sm">
              Our Jewelry Collection
            </h1>
            <p className="responsive-text-sm text-warm-gray max-w-2xl mx-auto">
              Discover exquisite pieces crafted with passion and precision
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6 sm:py-8 bg-white border-b">
        <div className="container-fluid">
          <div className="flex flex-col lg:flex-row gap-responsive items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-responsive-sm flex-1 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                <Input
                  type="text"
                  placeholder="Search jewelry..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="form-responsive pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryId?.toString() || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-48 md:w-56 touch-friendly">
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
                className="btn-responsive-sm flex items-center gap-2 touch-friendly"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Featured</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full lg:w-auto">
              {/* Clear Filters */}
              {(search || categoryId || featured) && (
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="btn-responsive-sm touch-friendly w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              )}

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg w-full sm:w-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none flex-1 sm:flex-none touch-friendly"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none flex-1 sm:flex-none touch-friendly"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-responsive-sm mt-4">
            {search && (
              <Badge variant="secondary" className="flex items-center gap-2 p-2 text-responsive-xs">
                Search: {search}
                <button 
                  onClick={() => setSearch("")} 
                  className="ml-1 hover:text-destructive touch-target text-lg"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {categoryId && (
              <Badge variant="secondary" className="flex items-center gap-2 p-2 text-responsive-xs">
                Category: {categories.find(c => c.id === categoryId)?.name}
                <button 
                  onClick={() => setCategoryId(undefined)} 
                  className="ml-1 hover:text-destructive touch-target text-lg"
                  aria-label="Remove category filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {featured && (
              <Badge variant="secondary" className="flex items-center gap-2 p-2 text-responsive-xs">
                Featured
                <button 
                  onClick={() => setFeatured(undefined)} 
                  className="ml-1 hover:text-destructive touch-target text-lg"
                  aria-label="Remove featured filter"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="p-responsive-sm">
        <div className="container-fluid">
          {isLoading ? (
            <ProductLoader />
          ) : products.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center m-responsive-sm">
                <p className="text-responsive-xs text-warm-gray mb-2 sm:mb-0">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className={
                viewMode === "grid" 
                  ? "responsive-grid-4 gap-responsive"
                  : "space-y-6"
              }>
                {products.map((product, index) => (
                  <CardReveal key={product.id} delay={index * 0.05}>
                    <ProductCard 
                      product={product} 
                      variant={viewMode}
                    />
                  </CardReveal>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center p-responsive-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto m-responsive-sm bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="heading-sm text-deep-navy m-responsive-sm">No products found</h3>
              <p className="responsive-text-sm text-warm-gray m-responsive-sm">
                Try adjusting your search or filter criteria
              </p>
              <Button 
                onClick={clearFilters} 
                variant="outline"
                className="btn-responsive-sm touch-friendly"
              >
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
