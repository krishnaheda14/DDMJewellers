import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Download, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function DayBook() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd")
  });

  // Fetch day book entries
  const { data: dayBookEntries = [], isLoading: isLoadingEntries, refetch: refetchEntries } = useQuery({
    queryKey: ["/api/admin/day-book", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });
      const res = await apiRequest("GET", `/api/admin/day-book?${params}`);
      return res.json();
    },
  });

  // Fetch specific day book entry
  const { data: dayEntry, isLoading: isLoadingDay, refetch: refetchDay } = useQuery({
    queryKey: ["/api/admin/day-book", selectedDate],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/day-book/${selectedDate}`);
      return res.json();
    },
    enabled: !!selectedDate,
  });

  // Fetch sales report for overview
  const { data: salesReport, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/admin/sales-report", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        salesType: "both"
      });
      const res = await apiRequest("GET", `/api/admin/sales-report?${params}`);
      return res.json();
    },
  });

  // Export sales report mutation
  const exportReportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        salesType: "both",
        format
      });
      
      if (format === 'csv') {
        const res = await apiRequest("GET", `/api/admin/sales-report/export?${params}`);
        return res.blob();
      } else {
        const res = await apiRequest("GET", `/api/admin/sales-report/export?${params}`);
        return res.json();
      }
    },
    onSuccess: (data, format) => {
      if (format === 'csv') {
        const url = window.URL.createObjectURL(data as Blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `sales-report-${dateRange.from}-${dateRange.to}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Success",
          description: "Sales report exported successfully",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export sales report",
        variant: "destructive",
      });
    },
  });

  const refreshData = () => {
    refetchEntries();
    refetchDay();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-report"] });
    toast({
      title: "Success",
      description: "Data refreshed successfully",
    });
  };

  const totalRevenue = salesReport?.summary?.totalRevenue || 0;
  const totalOrders = salesReport?.summary?.totalOrders || 0;
  const onlineRevenue = salesReport?.summary?.onlineRevenue || 0;
  const offlineRevenue = salesReport?.summary?.offlineRevenue || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Day Book & Business Reports</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportReportMutation.mutate('csv')}
            disabled={exportReportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Business Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 3600 * 24))} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Online & Offline combined
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{onlineRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Revenue</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{offlineRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? Math.round((offlineRevenue / totalRevenue) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="range">Date Range</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily Date Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="selectedDate">Business Date</Label>
                  <Input
                    id="selectedDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
                    Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Summary */}
          {dayEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Daily Summary - {format(new Date(selectedDate), "dd MMMM yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Online Sales</p>
                    <p className="text-2xl font-bold">₹{parseFloat(dayEntry.onlineRevenue || "0").toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{dayEntry.onlineOrders || 0} orders</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Offline Sales</p>
                    <p className="text-2xl font-bold">₹{parseFloat(dayEntry.offlineRevenue || "0").toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{dayEntry.offlineSales || 0} sales</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{parseFloat(dayEntry.totalRevenue || "0").toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{(dayEntry.onlineOrders || 0) + (dayEntry.offlineSales || 0)} total</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Breakdown</p>
                    <div className="space-y-1">
                      {dayEntry.paymentModeBreakdown && typeof dayEntry.paymentModeBreakdown === 'object' ? 
                        Object.entries(dayEntry.paymentModeBreakdown).map(([mode, amount]) => (
                          <div key={mode} className="flex justify-between text-sm">
                            <span className="capitalize">{mode.replace('_', ' ')}</span>
                            <span>₹{parseFloat(amount as string).toLocaleString()}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">No breakdown available</p>
                        )
                      }
                    </div>
                  </div>
                </div>

                {/* Additional metrics if available */}
                {dayEntry.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{dayEntry.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="range" className="space-y-4">
          {/* Date Range Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Date Range Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange({
                    from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                    to: format(new Date(), "yyyy-MM-dd")
                  })}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange({
                    from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                    to: format(new Date(), "yyyy-MM-dd")
                  })}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange({
                    from: format(subDays(new Date(), 90), "yyyy-MM-dd"),
                    to: format(new Date(), "yyyy-MM-dd")
                  })}
                >
                  Last 90 Days
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Day Book Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Day Book Entries</CardTitle>
              <CardDescription>
                Business summary for selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div>Loading day book entries...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Online Revenue</TableHead>
                      <TableHead>Offline Revenue</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Orders/Sales</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayBookEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.businessDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>₹{parseFloat(entry.onlineRevenue || "0").toLocaleString()}</TableCell>
                        <TableCell>₹{parseFloat(entry.offlineRevenue || "0").toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{parseFloat(entry.totalRevenue || "0").toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Online: {entry.onlineOrders || 0}</div>
                            <div>Offline: {entry.offlineSales || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Complete</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Sales Analytics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {salesReport?.summary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Online Sales</span>
                      <div className="text-right">
                        <div className="font-medium">₹{onlineRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Offline Sales</span>
                      <div className="text-right">
                        <div className="font-medium">₹{offlineRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {totalRevenue > 0 ? Math.round((offlineRevenue / totalRevenue) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${totalRevenue > 0 ? (offlineRevenue / totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div>Loading analytics...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Mode Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {salesReport?.paymentModeBreakdown ? (
                  <div className="space-y-3">
                    {Object.entries(salesReport.paymentModeBreakdown).map(([mode, amount]) => (
                      <div key={mode} className="flex justify-between items-center">
                        <span className="capitalize">{mode.replace('_', ' ')}</span>
                        <div className="text-right">
                          <div className="font-medium">₹{parseFloat(amount as string).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {totalRevenue > 0 ? Math.round((parseFloat(amount as string) / totalRevenue) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No payment data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          {salesReport?.categoryBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(salesReport.categoryBreakdown).map(([category, data]: [string, any]) => (
                    <div key={category} className="text-center p-4 border rounded-lg">
                      <h3 className="font-medium capitalize">{category}</h3>
                      <p className="text-2xl font-bold">₹{parseFloat(data.revenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{data.count || 0} orders</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}