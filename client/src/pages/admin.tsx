import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductForm from "@/components/admin/product-form";
import CategoryForm from "@/components/admin/category-form";
import TutorialManagement from "@/components/admin/tutorial-management";
import ExchangeManagement from "@/components/admin/exchange-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Search, Package, Users, ShoppingCart, TrendingUp, Folder } from "lucide-react";
import type { Product, Category, Order } from "@shared/schema";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  }, [user, authLoading, toast]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: user?.isAdmin,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: user?.isAdmin,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: user?.isAdmin,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "Order status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalCustomers = new Set(orders.map(order => order.userId)).size;

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductFormOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductFormOpen(true);
  };

  const handleProductFormSuccess = () => {
    setIsProductFormOpen(false);
    setSelectedProduct(null);
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleCategoryFormSuccess = () => {
    setIsCategoryFormOpen(false);
    setSelectedCategory(null);
    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Admin Dashboard</h1>
          <p className="text-warm-gray mt-2">Manage your jewelry store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-gray">Total Products</p>
                  <p className="text-2xl font-bold text-deep-navy">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-gold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-gray">Total Orders</p>
                  <p className="text-2xl font-bold text-deep-navy">{orders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-gold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-gray">Total Customers</p>
                  <p className="text-2xl font-bold text-deep-navy">{totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-gold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-gray">Total Revenue</p>
                  <p className="text-2xl font-bold text-deep-navy">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gold" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="exchange">Exchange</TabsTrigger>
            <TabsTrigger value="tutorials">Care Tutorials</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-warm-gray" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddProduct} className="bg-gold hover:bg-gold/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                  </DialogHeader>
                  <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    onSuccess={handleProductFormSuccess}
                    onCancel={() => setIsProductFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-deep-navy truncate">{product.name}</h3>
                      <div className="flex gap-1 ml-2">
                        {product.featured && <Badge className="bg-gold text-white text-xs">Featured</Badge>}
                        <Badge variant={product.inStock ? "default" : "destructive"} className="text-xs">
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-warm-gray mb-3 line-clamp-2">{product.description}</p>
                    <p className="text-lg font-bold text-gold mb-4">
                      ₹{parseFloat(product.price).toLocaleString('en-IN')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        disabled={deleteProductMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-deep-navy">Categories</h2>
              <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddCategory} className="bg-gold hover:bg-gold/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    category={selectedCategory}
                    onSuccess={handleCategoryFormSuccess}
                    onCancel={() => setIsCategoryFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    {category.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={category.imageUrl} 
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-deep-navy mb-2">{category.name}</h3>
                    <p className="text-sm text-warm-gray mb-4">{category.description || "No description"}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gold">
                        {products.filter(p => p.categoryId === category.id).length} products
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="text-deep-navy hover:text-gold"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-deep-navy mb-2">No orders yet</h3>
                    <p className="text-warm-gray">Orders will appear here when customers make purchases.</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-deep-navy">Order #{order.id}</h3>
                          <p className="text-sm text-warm-gray">
                            {new Date(order.createdAt!).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold">
                            ₹{parseFloat(order.total).toLocaleString('en-IN')}
                          </p>
                          <Badge
                            variant={
                              order.status === "pending" ? "secondary" :
                              order.status === "processing" ? "default" :
                              order.status === "shipped" ? "default" :
                              order.status === "delivered" ? "default" :
                              "destructive"
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      {order.shippingAddress && (
                        <div className="mb-4 p-3 bg-cream-white rounded">
                          <p className="text-sm font-medium text-deep-navy mb-1">Shipping Address:</p>
                          <p className="text-sm text-warm-gray">
                            {order.shippingAddress.name}<br />
                            {order.shippingAddress.address}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                            Phone: {order.shippingAddress.phone}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatusMutation.mutate({ 
                            id: order.id, 
                            status: e.target.value 
                          })}
                          className="px-3 py-1 border rounded text-sm"
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Exchange Tab */}
          <TabsContent value="exchange" className="space-y-6">
            <ExchangeManagement />
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <TutorialManagement />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
