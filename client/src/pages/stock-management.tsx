import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, AlertTriangle, Search, TrendingUp, TrendingDown, Package } from "lucide-react";
import { format } from "date-fns";

export default function StockManagement() {
  const { toast } = useToast();
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filters, setFilters] = useState({
    category: "",
    lowStock: false,
    search: ""
  });

  // Fetch stock items
  const { data: stockItems = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ["/api/admin/stock-items", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value.toString());
      });
      const res = await apiRequest("GET", `/api/admin/stock-items?${params}`);
      return res.json();
    },
  });

  // Fetch stock movements
  const { data: stockMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ["/api/admin/stock-movements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stock-movements");
      return res.json();
    },
  });

  // Create/Update stock item mutation
  const saveStockMutation = useMutation({
    mutationFn: async (itemData: any) => {
      if (editingItem) {
        const res = await apiRequest("PUT", `/api/admin/stock-items/${editingItem.id}`, itemData);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/stock-items", itemData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-items"] });
      setIsStockDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: `Stock item ${editingItem ? "updated" : "created"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save stock item",
        variant: "destructive",
      });
    },
  });

  // Create stock movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (movementData: any) => {
      const res = await apiRequest("POST", "/api/admin/stock-movements", movementData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-movements"] });
      setIsMovementDialogOpen(false);
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record stock movement",
        variant: "destructive",
      });
    },
  });

  const handleStockSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      currentStock: parseInt(formData.get("currentStock") as string),
      minStock: parseInt(formData.get("minStock") as string),
      maxStock: parseInt(formData.get("maxStock") as string),
      unit: formData.get("unit") as string,
      costPrice: parseFloat(formData.get("costPrice") as string) || null,
      sellingPrice: parseFloat(formData.get("sellingPrice") as string) || null,
      description: formData.get("description") as string || null,
    };

    saveStockMutation.mutate(itemData);
  };

  const handleMovementSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const movementData = {
      stockItemId: parseInt(formData.get("stockItemId") as string),
      movementType: formData.get("movementType") as string,
      quantity: parseInt(formData.get("quantity") as string),
      reason: formData.get("reason") as string,
      reference: formData.get("reference") as string || null,
    };

    createMovementMutation.mutate(movementData);
  };

  const lowStockItems = stockItems.filter((item: any) => item.currentStock <= item.minStock);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Management</h1>
        <div className="flex space-x-2">
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Stock Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Movement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMovementSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="stockItemId">Stock Item *</Label>
                  <Select name="stockItemId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems.map((item: any) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} (Current: {item.currentStock} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="movementType">Movement Type *</Label>
                  <Select name="movementType">
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    name="reason"
                    placeholder="e.g., New purchase, Sale, Damaged goods"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    name="reference"
                    placeholder="e.g., Bill number, Order ID"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMovementMutation.isPending}>
                    {createMovementMutation.isPending ? "Recording..." : "Record Movement"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Stock Item" : "Add New Stock Item"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={editingItem?.name || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" defaultValue={editingItem?.category || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gold">Gold Jewelry</SelectItem>
                        <SelectItem value="silver">Silver Jewelry</SelectItem>
                        <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                        <SelectItem value="gemstones">Gemstones</SelectItem>
                        <SelectItem value="diamonds">Diamonds</SelectItem>
                        <SelectItem value="raw_materials">Raw Materials</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currentStock">Current Stock *</Label>
                    <Input
                      id="currentStock"
                      name="currentStock"
                      type="number"
                      min="0"
                      required
                      defaultValue={editingItem?.currentStock || "0"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Min Stock *</Label>
                    <Input
                      id="minStock"
                      name="minStock"
                      type="number"
                      min="0"
                      required
                      defaultValue={editingItem?.minStock || "0"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxStock">Max Stock</Label>
                    <Input
                      id="maxStock"
                      name="maxStock"
                      type="number"
                      min="0"
                      defaultValue={editingItem?.maxStock || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select name="unit" defaultValue={editingItem?.unit || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="grams">Grams</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                        <SelectItem value="pairs">Pairs</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      name="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingItem?.costPrice || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellingPrice">Selling Price</Label>
                    <Input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingItem?.sellingPrice || ""}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Item description, specifications, etc."
                    defaultValue={editingItem?.description || ""}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveStockMutation.isPending}>
                    {saveStockMutation.isPending ? "Saving..." : editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stockItems.reduce((total: number, item: any) => 
                total + (item.currentStock * (item.costPrice || 0)), 0
              ).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Movements</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMovements.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="destructive">
                    {item.currentStock} {item.unit} (Min: {item.minStock})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Stock Items</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="gold">Gold Jewelry</SelectItem>
                      <SelectItem value="silver">Silver Jewelry</SelectItem>
                      <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                      <SelectItem value="gemstones">Gemstones</SelectItem>
                      <SelectItem value="diamonds">Diamonds</SelectItem>
                      <SelectItem value="raw_materials">Raw Materials</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lowStock">Show Low Stock Only</Label>
                  <Select value={filters.lowStock.toString()} onValueChange={(value) => setFilters({ ...filters, lowStock: value === "true" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">All Items</SelectItem>
                      <SelectItem value="true">Low Stock Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search items..."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Items</CardTitle>
              <CardDescription>
                {stockItems.length} total items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min/Max Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.description && (
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={item.currentStock <= item.minStock ? "text-red-500 font-medium" : ""}>
                            {item.currentStock} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            Min: {item.minStock}
                            {item.maxStock && ` / Max: ${item.maxStock}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.currentStock <= item.minStock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : item.maxStock && item.currentStock >= item.maxStock ? (
                            <Badge variant="secondary">Overstock</Badge>
                          ) : (
                            <Badge variant="default">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.costPrice ? (
                            <span>₹{(item.currentStock * item.costPrice).toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item);
                              setIsStockDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>
                Latest stock in/out transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Movement</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{movement.stockItem?.name || "Unknown Item"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={movement.movementType === "in" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {movement.movementType === "in" ? "Stock In" : 
                             movement.movementType === "out" ? "Stock Out" : 
                             movement.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={movement.movementType === "in" ? "text-green-600" : "text-red-600"}>
                            {movement.movementType === "in" ? "+" : "-"}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.reference || "-"}</TableCell>
                        <TableCell>{movement.performedBy || "System"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}