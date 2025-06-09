import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, Package, ShoppingCart, Star, Building2, Coins, MessageSquare, 
  MicIcon, Shield, TrendingUp, RefreshCw, Settings, Eye, CheckCircle, 
  XCircle, UserCheck, UserX, Crown, AlertTriangle, Phone, Mail, Calendar,
  Clock, Truck, Circle, ArrowRightLeft
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalWholesalers: number;
  totalCorporateUsers: number;
  totalProducts: number;
  totalOrders: number;
  ordersThisMonth: number;
  pendingWholesalerApprovals: number;
  pendingExchangeRequests: number;
  totalGullakSavings: number;
  activeGullakAccounts: number;
  totalCorporatePartners: number;
  chatbotInteractions: number;
  voiceChatSessions: number;
  recentOrders: any[];
  pendingApprovals: any[];
  topSellingProducts: any[];
}

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: corporateData = [], isLoading: corporateLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/corporate"],
  });

  const { data: gullakData = [], isLoading: gullakLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/gullak"],
  });

  const { data: chatbotData = { recentConversations: [], topQueries: [], analytics: { totalSessions: 0, avgResponseTime: 0, satisfactionRate: 0 } }, isLoading: chatbotLoading } = useQuery<any>({
    queryKey: ["/api/admin/chatbot"],
  });

  const { data: exchangeRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/exchange-requests"],
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  const updateUserApprovalMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/approve`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User approval updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user approval", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  const updateExchangeRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminAssignedValue, adminNotes }: { 
      requestId: number; 
      status: string; 
      adminAssignedValue?: number; 
      adminNotes?: string; 
    }) => {
      await apiRequest("PUT", `/api/admin/exchange-requests/${requestId}`, { 
        status, 
        adminAssignedValue, 
        adminNotes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-requests"] });
      toast({ title: "Exchange request updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update exchange request", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading comprehensive dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">DDM Jewellers Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Circle className="w-2 h-2 fill-current mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="corporate">Corporate</TabsTrigger>
          <TabsTrigger value="gullak">Gullak</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
          <TabsTrigger value="rates">Live Rates</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{stats?.totalUsers || 0}</div>
                <div className="text-xs text-blue-600 flex items-center space-x-2">
                  <span>Customers: {stats?.totalCustomers || 0}</span>
                  <span>Wholesalers: {stats?.totalWholesalers || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders This Month</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{stats?.ordersThisMonth || 0}</div>
                <p className="text-xs text-green-600">
                  Total Orders: {stats?.totalOrders || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corporate Partners</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{stats?.totalCorporatePartners || 0}</div>
                <p className="text-xs text-purple-600">
                  Active tie-ups
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">
                  {(stats?.pendingWholesalerApprovals || 0) + (stats?.pendingExchangeRequests || 0)}
                </div>
                <div className="text-xs text-yellow-600 flex flex-col">
                  <span>Wholesalers: {stats?.pendingWholesalerApprovals || 0}</span>
                  <span>Exchanges: {stats?.pendingExchangeRequests || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span>Gullak Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Savings</span>
                    <span className="font-medium">₹{stats?.totalGullakSavings?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Accounts</span>
                    <span className="font-medium">{stats?.activeGullakAccounts || 0}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setActiveTab("gullak")}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <span>AI Assistant Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Chat Interactions</span>
                    <span className="font-medium">{stats?.chatbotInteractions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Voice Sessions</span>
                    <span className="font-medium">{stats?.voiceChatSessions || 0}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setActiveTab("chatbot")}
                  >
                    Manage Chatbot
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRightLeft className="h-5 w-5 text-green-500" />
                  <span>Exchange Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending Review</span>
                    <span className="font-medium text-orange-600">{stats?.pendingExchangeRequests || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-medium">{exchangeRequests?.length || 0}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setActiveTab("orders")}
                  >
                    Review Requests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer and wholesaler orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentOrders?.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.total?.toLocaleString()}</p>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No recent orders</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topSellingProducts?.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.sales} sold</p>
                        <p className="text-sm text-muted-foreground">₹{product.revenue?.toLocaleString()}</p>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No sales data</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Management</h2>
            <div className="flex space-x-2">
              <Button variant="outline">Export Users</Button>
              <Button>Add Admin User</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Customers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                <p className="text-sm text-muted-foreground">Active customer accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Wholesalers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalWholesalers || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingWholesalerApprovals || 0} pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Corporate Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCorporateUsers || 0}</div>
                <p className="text-sm text-muted-foreground">From {stats?.totalCorporatePartners || 0} companies</p>
              </CardContent>
            </Card>
          </div>

          {!usersLoading && users && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.slice(0, 10).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Inactive</Badge>
                            )}
                            {!user.isEmailVerified && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Unverified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateUserStatusMutation.mutate({ 
                                userId: user.id, 
                                isActive: !user.isActive 
                              })}
                              disabled={updateUserStatusMutation.isPending}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            {user.role === 'wholesaler' && !user.isApproved && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateUserApprovalMutation.mutate({ 
                                  userId: user.id, 
                                  approved: true 
                                })}
                                disabled={updateUserApprovalMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <div className="flex space-x-2">
              <Button variant="outline">Export Orders</Button>
              <Button variant="outline">Filter</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processing</p>
                    <p className="text-2xl font-bold">{orders?.filter((o: any) => o.status === 'processing').length || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Shipped</p>
                    <p className="text-2xl font-bold">{orders?.filter((o: any) => o.status === 'shipped').length || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{orders?.filter((o: any) => o.status === 'completed').length || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                    <p className="text-2xl font-bold">{orders?.filter((o: any) => o.status === 'cancelled').length || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exchange Requests Section */}
          {exchangeRequests && exchangeRequests.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowRightLeft className="h-5 w-5 text-green-500" />
                  <span>Pending Exchange Requests</span>
                </CardTitle>
                <CardDescription>Review and approve jewelry exchange requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Estimated Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRequests.slice(0, 5).map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">#{request.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.customerName}</p>
                            <p className="text-sm text-muted-foreground">{request.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{request.description}</p>
                            <div className="flex space-x-2 mt-1">
                              <Button variant="outline" size="sm">View Photos</Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>₹{request.estimatedValue?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateExchangeRequestMutation.mutate({ 
                                requestId: request.id, 
                                status: 'approved',
                                adminAssignedValue: request.estimatedValue
                              })}
                              disabled={updateExchangeRequestMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateExchangeRequestMutation.mutate({ 
                                requestId: request.id, 
                                status: 'rejected',
                                adminNotes: 'Rejected by admin'
                              })}
                              disabled={updateExchangeRequestMutation.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!ordersLoading && orders && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Manage customer and wholesaler orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.slice(0, 10).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.itemCount || 1} items</TableCell>
                        <TableCell>₹{order.total?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'processing' ? 'secondary' :
                            order.status === 'shipped' ? 'outline' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <select 
                              className="text-sm border rounded px-2 py-1"
                              value={order.status}
                              onChange={(e) => updateOrderStatusMutation.mutate({ 
                                orderId: order.id, 
                                status: e.target.value 
                              })}
                            >
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs continue with corporate, gullak, chatbot, rates, and security management */}
        <TabsContent value="rates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Live Rates Management</h2>
            <div className="flex space-x-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Rates
              </Button>
              <Button>Update API Settings</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                  <span>Gold 24K</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹6,800/g</div>
                <p className="text-sm text-green-600">+₹45 (0.66%)</p>
                <p className="text-xs text-muted-foreground">Last updated: 2 mins ago</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <span>Silver</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹82.5/g</div>
                <p className="text-sm text-red-600">-₹1.2 (1.43%)</p>
                <p className="text-xs text-muted-foreground">Last updated: 2 mins ago</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <p className="text-xs text-muted-foreground">Last sync: 2 minutes ago</p>
                <p className="text-xs text-muted-foreground">Next update: 3 minutes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}