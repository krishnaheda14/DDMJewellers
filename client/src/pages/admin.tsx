import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Users, 
  ShoppingBag, 
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Settings,
  MessageSquare,
  Building2,
  Repeat,
  Grid3X3,
  BarChart3,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Calendar,
  Activity
} from "lucide-react";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Grid3X3 },
  { id: "exchanges", label: "Exchanges", icon: Repeat },
  { id: "corporate", label: "Corporate", icon: Building2 },
  { id: "chatbot", label: "Chatbot", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  // Queries
  const { data: adminStats = {} } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: true,
  });

  const { data: adminOrders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: activeTab === "orders",
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });

  const { data: adminProducts = [] } = useQuery({
    queryKey: ["/api/admin/products"],
    enabled: activeTab === "products",
  });

  const { data: adminCategories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: activeTab === "categories",
  });

  const { data: adminExchanges = [] } = useQuery({
    queryKey: ["/api/admin/exchanges"],
    enabled: activeTab === "exchanges",
  });

  const { data: corporateData = [] } = useQuery({
    queryKey: ["/api/admin/corporate"],
    enabled: activeTab === "corporate",
  });

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{adminStats.totalRevenue?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">+3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.user?.firstName} {order.user?.lastName}</p>
                  </div>
                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminProducts.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{product.price}</p>
                    <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminOrders.map((order: any) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">#{order.id}</td>
                    <td className="p-2">{order.user?.firstName} {order.user?.lastName}</td>
                    <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2">₹{order.total}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter((user: any) => user.role === "customer").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Wholesalers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter((user: any) => user.role === "wholesaler" && user.isApproved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.filter((user: any) => user.role === "wholesaler" && !user.isApproved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Joined</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user: any) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.firstName} {user.lastName}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.isApproved ? "default" : "secondary"}>
                        {user.isApproved ? "Active" : "Pending"}
                      </Badge>
                    </td>
                    <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Real Jewelry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminProducts.filter((p: any) => p.productType === "real").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Imitation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminProducts.filter((p: any) => p.productType === "imitation").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminProducts.filter((p: any) => p.stock < 10).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminProducts.map((product: any) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{product.category?.name}</td>
                    <td className="p-2">
                      <Badge variant={product.productType === "real" ? "default" : "secondary"}>
                        {product.productType}
                      </Badge>
                    </td>
                    <td className="p-2">₹{product.price}</td>
                    <td className="p-2">{product.stock}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ExchangesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exchange Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminExchanges.filter((ex: any) => ex.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminExchanges.filter((ex: any) => ex.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminExchanges.filter((ex: any) => ex.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Request ID</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Estimated Value</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminExchanges.map((exchange: any) => (
                  <tr key={exchange.id} className="border-b">
                    <td className="p-2">#{exchange.id}</td>
                    <td className="p-2">{exchange.customerName}</td>
                    <td className="p-2">{exchange.itemDescription}</td>
                    <td className="p-2">₹{exchange.estimatedValue}</td>
                    <td className="p-2">
                      <Badge variant={
                        exchange.status === "approved" ? "default" :
                        exchange.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {exchange.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CorporateView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Corporate Partnerships</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Partnership
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {corporateData.filter((corp: any) => corp.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {corporateData.filter((corp: any) => corp.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{corporateData.reduce((sum: number, corp: any) => sum + (corp.revenue || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Corporate Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Contact Person</th>
                  <th className="text-left p-2">Employees</th>
                  <th className="text-left p-2">Discount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {corporateData.map((corporate: any) => (
                  <tr key={corporate.id} className="border-b">
                    <td className="p-2">{corporate.companyName}</td>
                    <td className="p-2">{corporate.contactPerson}</td>
                    <td className="p-2">{corporate.employeeCount}</td>
                    <td className="p-2">{corporate.discountPercentage}%</td>
                    <td className="p-2">
                      <Badge variant={corporate.status === "active" ? "default" : "secondary"}>
                        {corporate.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ChatbotView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chatbot Analytics</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2m</div>
            <p className="text-xs text-muted-foreground">+8% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Positive feedback</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { query: "Product recommendations", count: 234, trend: "+15%" },
              { query: "Jewelry care tips", count: 189, trend: "+8%" },
              { query: "Exchange process", count: 156, trend: "+22%" },
              { query: "Custom jewelry design", count: 142, trend: "+5%" },
              { query: "Gold rates inquiry", count: 128, trend: "+18%" }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{item.query}</p>
                  <p className="text-sm text-muted-foreground">{item.count} queries</p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {item.trend}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CategoriesView = () => {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategorySlug, setNewCategorySlug] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<string>("none");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const createCategoryMutation = useMutation({
      mutationFn: async (categoryData: any) => {
        return await apiRequest("POST", "/api/admin/categories", categoryData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
        setIsCreateDialogOpen(false);
        setNewCategoryName("");
        setNewCategorySlug("");
        setSelectedParentId("none");
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      },
      onError: (error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        });
      },
    });

    const deleteCategoryMutation = useMutation({
      mutationFn: async (categoryId: number) => {
        return await apiRequest("DELETE", `/api/admin/categories/${categoryId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      },
      onError: (error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        });
      },
    });

    const seedCategoriesMutation = useMutation({
      mutationFn: async () => {
        return await apiRequest("POST", "/api/admin/seed-categories");
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
        toast({
          title: "Success",
          description: "Comprehensive category structure created successfully",
        });
      },
      onError: (error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to seed categories",
          variant: "destructive",
        });
      },
    });

    const mainCategories = adminCategories.filter((cat: any) => !cat.parentId);
    const subcategories = adminCategories.filter((cat: any) => cat.parentId);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Category Management</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => seedCategoriesMutation.mutate()}
              disabled={seedCategoriesMutation.isPending}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Seed Categories
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category Name</label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={newCategorySlug}
                      onChange={(e) => setNewCategorySlug(e.target.value)}
                      placeholder="Enter category slug"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Parent Category</label>
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Main Category)</SelectItem>
                        {mainCategories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      createCategoryMutation.mutate({
                        name: newCategoryName,
                        slug: newCategorySlug,
                        parentId: selectedParentId === "none" ? null : parseInt(selectedParentId),
                      });
                    }}
                    disabled={!newCategoryName || !newCategorySlug || createCategoryMutation.isPending}
                    className="w-full"
                  >
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mainCategories.map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.slug}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subcategories.map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Parent: {mainCategories.find((p: any) => p.id === category.parentId)?.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Slug</th>
                    <th className="text-left p-2">Parent</th>
                    <th className="text-left p-2">Products</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCategories.map((category: any) => (
                    <tr key={category.id} className="border-b">
                      <td className="p-2">{category.name}</td>
                      <td className="p-2">{category.slug}</td>
                      <td className="p-2">
                        {category.parentId 
                          ? mainCategories.find((p: any) => p.id === category.parentId)?.name 
                          : "Main Category"
                        }
                      </td>
                      <td className="p-2">{category.productCount || 0}</td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const SettingsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Site Name</label>
                <Input defaultValue="DDM Jewellers" />
              </div>
              <div>
                <label className="text-sm font-medium">Admin Email</label>
                <Input defaultValue="admin@ddmjewellers.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Select defaultValue="INR">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Default User Role</label>
                <Select defaultValue="customer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Auto-approve Wholesalers</label>
                <Select defaultValue="manual">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Review</SelectItem>
                    <SelectItem value="auto">Auto Approve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Update Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Product updated", user: "Admin", time: "2 hours ago" },
                  { action: "User role changed", user: "Admin", time: "4 hours ago" },
                  { action: "Order status updated", user: "Admin", time: "6 hours ago" },
                  { action: "Exchange request approved", user: "Admin", time: "1 day ago" }
                ].map((log, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">by {log.user}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Enhanced security for admin accounts</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Select defaultValue="60">
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30m</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                    <SelectItem value="120">2h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "orders":
        return <OrdersView />;
      case "users":
        return <UsersView />;
      case "products":
        return <ProductsView />;
      case "categories":
        return <CategoriesView />;
      case "exchanges":
        return <ExchangesView />;
      case "corporate":
        return <CorporateView />;
      case "chatbot":
        return <ChatbotView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen sticky top-0">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-amber-600">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">DDM Jewellers</p>
          </div>
          
          <nav className="mt-6">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeTab === item.id ? "bg-amber-50 dark:bg-amber-900/20 border-r-2 border-amber-600 text-amber-600" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Admin;