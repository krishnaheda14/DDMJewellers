import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Package, Plus, Edit, Trash2, ArrowLeft, Search, Filter } from "lucide-react";
import { insertCategorySchema, type InsertCategory, type Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageNavigation from "@/components/page-navigation";

export default function AdminCategories() {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParent, setFilterParent] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Check URL parameters for initial filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam === 'main' || filterParam === 'sub') {
      setFilterParent(filterParam);
    }
  }, []);

  // Redirect if not admin
  if (!isLoading && (!user || !isAdmin)) {
    setLocation("/auth");
    return null;
  }

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: isAdmin,
  });

  // Create category form
  const createForm = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentId: null,
      isActive: true,
    },
  });

  // Edit category form
  const editForm = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentId: null,
      isActive: true,
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertCategory) => apiRequest("/api/admin/categories", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCategory> }) => 
      apiRequest(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setEditingCategory(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/categories/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Delete all categories mutation
  const deleteAllCategoriesMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/categories/bulk-delete", {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Success",
        description: "All categories deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all categories",
        variant: "destructive",
      });
    },
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle create form submission
  const onCreateSubmit = (data: InsertCategory) => {
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }
    createCategoryMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: InsertCategory) => {
    if (!editingCategory) return;
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }
    updateCategoryMutation.mutate({ id: editingCategory.id, data });
  };

  // Handle edit click
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parentId,
      isActive: category.isActive,
    });
  };

  // Handle delete click
  const handleDelete = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // Handle status toggle
  const handleToggleStatus = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category.id,
      data: { isActive: !category.isActive }
    });
  };

  // Filter categories
  const mainCategories = categories.filter((cat: Category) => !cat.parentId);
  const subcategories = categories.filter((cat: Category) => cat.parentId);

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterParent === "all") return matchesSearch;
    if (filterParent === "main") return matchesSearch && !category.parentId;
    if (filterParent === "sub") return matchesSearch && category.parentId;
    return matchesSearch && category.parentId?.toString() === filterParent;
  });

  if (isLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-amber-800 dark:text-amber-200">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <PageNavigation />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Package className="h-8 w-8 text-amber-600" />
                  Category Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage jewelry categories and subcategories
                </p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category or subcategory to organize your jewelry products.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Category name"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!createForm.getValues().slug) {
                                  createForm.setValue("slug", generateSlug(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="category-slug" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Category description (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Category</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select parent category (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Parent (Main Category)</SelectItem>
                              {mainCategories.map((category: Category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCategoryMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {createCategoryMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Main Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mainCategories.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcategories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Bulk Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={filterParent} onValueChange={setFilterParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="main">Main Categories</SelectItem>
                    <SelectItem value="sub">Subcategories</SelectItem>
                    {mainCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        Under {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick Stats and Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {categories.length} categories</span>
                <span>Main: {mainCategories.length}</span>
                <span>Subcategories: {subcategories.length}</span>
                {filterParent !== "all" && (
                  <span>Filtered: {filteredCategories.length} shown</span>
                )}
              </div>
              
              {categories.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ALL ${categories.length} categories? This action cannot be undone.`)) {
                      deleteAllCategoriesMutation.mutate();
                    }
                  }}
                  disabled={deleteAllCategoriesMutation.isPending}
                  className="text-xs"
                >
                  {deleteAllCategoriesMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete All Categories
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hierarchical Categories Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Main Categories
              </CardTitle>
              <CardDescription>
                Body part categories that organize jewelry types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mainCategories
                  .filter((category: Category) => 
                    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((category: Category) => {
                    const categorySubcategories = subcategories.filter((sub: Category) => sub.parentId === category.id);
                    return (
                      <div
                        key={category.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            <Badge variant="outline">
                              {categorySubcategories.length} subcategories
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(category)}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Slug: {category.slug}
                        </p>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-3">
                            {category.description}
                          </p>
                        )}
                        
                        {/* Quick Actions */}
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsCreateDialogOpen(true);
                                createForm.setValue("parentId", category.id);
                              }}
                              className="text-xs flex-1"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Subcategory
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                          
                          {/* Category Status Toggle */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Status:</span>
                            <Button
                              variant={category.isActive ? "default" : "secondary"}
                              size="sm"
                              onClick={() => handleToggleStatus(category)}
                              className="h-6 px-2 text-xs"
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {mainCategories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No main categories found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subcategories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Subcategories
              </CardTitle>
              <CardDescription>
                Specific jewelry types organized under main categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filterParent === "all" || filterParent === "sub" ? (
                  // Show all subcategories grouped by parent
                  mainCategories.map((parent: Category) => {
                    const categorySubcategories = subcategories.filter((sub: Category) => 
                      sub.parentId === parent.id &&
                      (sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sub.slug.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    
                    if (categorySubcategories.length === 0) return null;
                    
                    return (
                      <div key={parent.id} className="mb-6">
                        <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {parent.name} ({categorySubcategories.length})
                        </h4>
                        <div className="space-y-2 ml-4">
                          {categorySubcategories.map((subcategory: Category) => (
                            <div
                              key={subcategory.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium">{subcategory.name}</h5>
                                  {!subcategory.isActive && (
                                    <Badge variant="destructive" className="text-xs">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Slug: {subcategory.slug}
                                </p>
                                {subcategory.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {subcategory.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(subcategory)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(subcategory)}
                                  disabled={deleteCategoryMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Show subcategories for specific parent
                  subcategories
                    .filter((sub: Category) => 
                      sub.parentId?.toString() === filterParent &&
                      (sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sub.slug.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((subcategory: Category) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{subcategory.name}</h5>
                            {!subcategory.isActive && (
                              <Badge variant="destructive">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Slug: {subcategory.slug}
                          </p>
                          {subcategory.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {subcategory.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subcategory)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(subcategory)}
                            disabled={deleteCategoryMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
                
                {subcategories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subcategories found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Category name"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editForm.getValues().slug) {
                              editForm.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="category-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Category description (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select 
                        value={field.value?.toString() || "none"} 
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent category (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Parent (Main Category)</SelectItem>
                          {mainCategories
                            .filter(c => c.id !== editingCategory?.id)
                            .map((category: Category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        value={field.value ? "active" : "inactive"} 
                        onValueChange={(value) => field.onChange(value === "active")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCategoryMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {updateCategoryMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}