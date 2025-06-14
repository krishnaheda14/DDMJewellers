import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  RefreshCw, 
  Building2, 
  MessageSquare, 
  Settings, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Download,
  Bell,
  Filter,
  Eye,
  Check,
  X,
  Calendar,
  DollarSign,
  UserCheck,
  Crown,
  Briefcase
} from "lucide-react";
import type { Product, Category, Order, User } from "@shared/schema";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || (user as any)?.role !== 'admin')) {
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
    enabled: (user as any)?.role === 'admin',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: exchangeRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/exchange-requests"],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: corporateRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/corporate-requests"],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: adminCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    enabled: (user as any)?.role === 'admin',
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const pendingExchanges = exchangeRequests.filter((req: any) => req.status === "pending").length;
  const pendingCorporate = corporateRequests.filter((req: any) => req.status === "pending").length;
  const activeCorporate = corporateRequests.filter((req: any) => req.status === "approved").length;
  const customerCount = users.filter((u: any) => u.role === "customer").length;
  const wholesalerCount = users.filter((u: any) => u.role === "wholesaler").length;
  const corporateCount = users.filter((u: any) => u.role === "corporate").length;

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "users", label: "Users", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Package },
    { id: "exchanges", label: "Exchange Requests", icon: RefreshCw },
    { id: "corporate", label: "Corporate Tie-ups", icon: Building2 },
    { id: "chatbot", label: "Chatbot Analytics", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Requests</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchangeRequests.length}</div>
            <p className="text-xs text-muted-foreground">{pendingExchanges} pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCorporate}</div>
            <p className="text-xs text-muted-foreground">{pendingCorporate} pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* User Registration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">Regular customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wholesalers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wholesalerCount}</div>
            <p className="text-xs text-muted-foreground">Business partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate Users</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateCount}</div>
            <p className="text-xs text-muted-foreground">Employee accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-sm text-muted-foreground">₹{parseFloat(order.total || "0").toLocaleString('en-IN')}</p>
                </div>
                <Badge variant={order.status === "pending" ? "outline" : "default"}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders Management</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Orders</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">#{order.id}</td>
                    <td className="p-2">{order.userId}</td>
                    <td className="p-2">₹{parseFloat(order.total || "0").toLocaleString('en-IN')}</td>
                    <td className="p-2">
                      <Badge variant={order.status === "pending" ? "outline" : "default"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
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

  const UsersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Users</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="wholesaler">Wholesalers</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Joined</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user: any) => userFilter === "all" || user.role === userFilter)
                  .filter((user: any) => 
                    searchTerm === "" || 
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user: any) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.id}</td>
                    <td className="p-2">{user.firstName} {user.lastName}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.isApproved ? "default" : "destructive"}>
                        {user.isApproved ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
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

  const ProductsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Products</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(product => 
                    searchTerm === "" || 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded"></div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{product.categoryId}</td>
                    <td className="p-2">₹{parseFloat(product.price).toLocaleString('en-IN')}</td>
                    <td className="p-2">{(product as any).stockQuantity || 'N/A'}</td>
                    <td className="p-2">
                      <Badge variant={product.featured ? "default" : "outline"}>
                        {product.featured ? "Featured" : "Regular"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
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
        <h2 className="text-2xl font-bold">Exchange Requests</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Bulk Approve
          </Button>
          <Button variant="outline">
            <X className="h-4 w-4 mr-2" />
            Bulk Reject
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Exchange Requests</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exchangeRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No exchange requests found</p>
              </div>
            ) : (
              exchangeRequests
                .filter((req: any) => exchangeFilter === "all" || req.status === exchangeFilter)
                .map((request: any, index: number) => (
                <div key={request.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Request #{request.id || index + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.jewelryType || 'N/A'} - {request.weight || 'N/A'}g - {request.purity || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={request.status === "pending" ? "outline" : "default"}>
                      {request.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Estimated Value</p>
                      <p className="text-lg">₹{request.estimatedValue?.toLocaleString('en-IN') || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  {(!request.status || request.status === "pending") && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CorporateView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Corporate Tie-ups</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Corporate Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCorporate}</div>
            <p className="text-xs text-muted-foreground">Approved companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCorporate}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateRequests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Corporate Requests</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {corporateRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No corporate requests found</p>
              </div>
            ) : (
              corporateRequests.map((request: any, index: number) => (
                <div key={request.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{request.companyName || 'Company Name'}</h3>
                      <p className="text-sm text-muted-foreground">{request.industry || 'Industry not specified'}</p>
                      <p className="text-sm text-muted-foreground">{request.employeeCount || 'N/A'} employees</p>
                    </div>
                    <Badge variant={request.status === "pending" ? "outline" : "default"}>
                      {request.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Contact Person</p>
                      <p>{request.contactPersonName || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{request.contactEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  {(!request.status || request.status === "pending") && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Set Offers
                      </Button>
                    </div>
                  )}
                  {request.status === "approved" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Offers
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        View Employees
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
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
              onClick={() => {
                if (confirm("This will replace all existing categories with a comprehensive jewelry category structure. Continue?")) {
                  seedCategoriesMutation.mutate();
                }
              }}
              disabled={seedCategoriesMutation.isPending}
            >
              {seedCategoriesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Seeding...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Seed Categories
                </>
              )}
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
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="category-slug"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parent Category</label>
                  <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent (Main Category)</SelectItem>
                      {mainCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    const categoryData = {
                      name: newCategoryName,
                      slug: newCategorySlug,
                      parentId: selectedParentId === "none" ? null : parseInt(selectedParentId),
                    };
                    createCategoryMutation.mutate(categoryData);
                  }}
                  disabled={!newCategoryName || !newCategorySlug || createCategoryMutation.isPending}
                  className="w-full"
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Total Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCategories.length}</div>
              <p className="text-sm text-muted-foreground">All categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Main Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mainCategories.length}</div>
              <p className="text-sm text-muted-foreground">Parent categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Subcategories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcategories.length}</div>
              <p className="text-sm text-muted-foreground">Child categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Main Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mainCategories.map((category: any) => {
                  const categorySubcategories = subcategories.filter((sub: any) => sub.parentId === category.id);
                  return (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
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
                      {categorySubcategories.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Subcategories ({categorySubcategories.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {categorySubcategories.map((sub: any) => (
                              <Badge key={sub.id} variant="outline" className="text-xs">
                                {sub.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* All Categories Table */}
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
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminCategories.map((category: any) => (
                      <tr key={category.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{category.slug}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={category.parentId ? "outline" : "default"}>
                            {category.parentId ? "Sub" : "Main"}
                          </Badge>
                        </td>
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
      </div>
    );
  };

  const SettingsView = () => (
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