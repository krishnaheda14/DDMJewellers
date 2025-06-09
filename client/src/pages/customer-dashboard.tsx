import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Heart, Package, Star, Gem, Clock, Gift, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageNavigation from "@/components/page-navigation";
import { useLocation } from "wouter";

export default function CustomerDashboard() {
  const { user, isLoading, isCustomer } = useAuth();

  const [, setLocation] = useLocation();
  
  // Redirect if not customer
  if (!isLoading && (!user || !isCustomer)) {
    setLocation("/auth");
    return null;
  }

  const { data: customerStats } = useQuery({
    queryKey: ["/api/customer/stats"],
    enabled: isCustomer,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Gem className="h-12 w-12 text-rose-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-rose-800 dark:text-rose-200">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <PageNavigation />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Gem className="h-8 w-8 text-rose-600" />
                Welcome Back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Discover our exquisite jewelry collection crafted just for you
              </p>
            </div>
            <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
              Premium Customer
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Lifetime purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.wishlistItems || 0}</div>
              <p className="text-xs text-muted-foreground">Saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.loyaltyPoints || 0}</div>
              <p className="text-xs text-muted-foreground">Redeem for rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gullak Savings</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{customerStats?.gullakBalance?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Saved towards gold</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Shop Jewelry
              </CardTitle>
              <CardDescription>
                Explore our latest collection of exquisite jewelry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/shop'}>
                Browse Collection
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Track Orders
              </CardTitle>
              <CardDescription>
                View your recent orders and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/orders'}>
                View Orders
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                My Wishlist
              </CardTitle>
              <CardDescription>
                Items you've saved for future purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/wishlist'}>
                View Wishlist
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Gullak Savings
              </CardTitle>
              <CardDescription>
                Save towards your dream jewelry purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/gullak'}>
                Manage Gullak
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Loyalty Program
              </CardTitle>
              <CardDescription>
                Earn points and unlock exclusive rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/loyalty'}>
                View Rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/profile'}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Order #1234 shipped</p>
                    <p className="text-sm text-muted-foreground">Diamond Earrings - Expected delivery: Tomorrow</p>
                  </div>
                  <Badge variant="outline">Shipped</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Gullak auto-payment processed</p>
                    <p className="text-sm text-muted-foreground">₹5,000 added to your gold savings</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Loyalty points earned</p>
                    <p className="text-sm text-muted-foreground">+250 points from recent purchase</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Earned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}