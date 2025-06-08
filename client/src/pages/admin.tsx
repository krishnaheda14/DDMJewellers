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
import type { Product, Category, Order } from "@shared/schema";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
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
    enabled: user?.role === 'admin',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: user?.role === 'admin',
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: user?.role === 'admin',
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === 'admin',
  });

  const { data: exchangeRequests = [] } = useQuery({
    queryKey: ["/api/admin/exchange-requests"],
    enabled: user?.role === 'admin',
  });

  const { data: corporateRequests = [] } = useQuery({
    queryKey: ["/api/admin/corporate-requests"],
    enabled: user?.role === 'admin',
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
                    <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
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
            {exchangeRequests
              .filter((req: any) => exchangeFilter === "all" || req.status === exchangeFilter)
              .map((request: any, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">Request #{request.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {request.jewelryType} - {request.weight}g - {request.purity}
                    </p>
                  </div>
                  <Badge variant={request.status === "pending" ? "outline" : "default"}>
                    {request.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Estimated Value</p>
                    <p className="text-lg">₹{request.estimatedValue?.toLocaleString('en-IN') || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {request.status === "pending" && (
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
            ))}
          </div>
        </CardContent>
      </Card>
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
      case "exchanges":
        return <ExchangesView />;
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