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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Download } from "lucide-react";
import { format } from "date-fns";

export default function OfflineSalesManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    category: "",
    paymentMode: "",
    search: ""
  });

  // Fetch offline sales
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/admin/offline-sales", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const res = await apiRequest("GET", `/api/admin/offline-sales?${params}`);
      return res.json();
    },
  });

  // Create/Update offline sale mutation
  const saveSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (editingSale) {
        const res = await apiRequest("PUT", `/api/admin/offline-sales/${editingSale.id}`, saleData);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/offline-sales", saleData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offline-sales"] });
      setIsDialogOpen(false);
      setEditingSale(null);
      toast({
        title: "Success",
        description: `Offline sale ${editingSale ? "updated" : "created"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save offline sale",
        variant: "destructive",
      });
    },
  });

  // Delete sale mutation
  const deleteSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/offline-sales/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offline-sales"] });
      toast({
        title: "Success",
        description: "Offline sale deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete offline sale",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const saleData = {
      customerName: formData.get("customerName") as string,
      mobileNumber: formData.get("mobileNumber") as string,
      productName: formData.get("productName") as string,
      productCategory: formData.get("productCategory") as string,
      weightGrams: parseFloat(formData.get("weightGrams") as string) || null,
      ratePerGram: parseFloat(formData.get("ratePerGram") as string) || null,
      makingCharges: parseFloat(formData.get("makingCharges") as string) || 0,
      gemstonesCost: parseFloat(formData.get("gemstonesCost") as string) || 0,
      diamondsCost: parseFloat(formData.get("diamondsCost") as string) || 0,
      gstPercentage: parseFloat(formData.get("gstPercentage") as string) || 3,
      gstAmount: parseFloat(formData.get("gstAmount") as string) || 0,
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      paymentMode: formData.get("paymentMode") as string,
      billNumber: formData.get("billNumber") as string,
      saleDate: new Date(formData.get("saleDate") as string).toISOString(),
    };

    saveSaleMutation.mutate(saleData);
  };

  const calculateTotal = (e: any) => {
    const form = e.target.form;
    if (!form) return;

    const weight = parseFloat(form.weightGrams.value) || 0;
    const rate = parseFloat(form.ratePerGram.value) || 0;
    const making = parseFloat(form.makingCharges.value) || 0;
    const gemstones = parseFloat(form.gemstonesCost.value) || 0;
    const diamonds = parseFloat(form.diamondsCost.value) || 0;
    const gstPercentage = parseFloat(form.gstPercentage.value) || 3;

    const subtotal = (weight * rate) + making + gemstones + diamonds;
    const gstAmount = (subtotal * gstPercentage) / 100;
    const total = subtotal + gstAmount;

    form.gstAmount.value = gstAmount.toFixed(2);
    form.totalAmount.value = total.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Offline Sales Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSale(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Offline Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Edit Offline Sale" : "Add New Offline Sale"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    defaultValue={editingSale?.customerName || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    defaultValue={editingSale?.mobileNumber || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    name="productName"
                    required
                    defaultValue={editingSale?.productName || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="productCategory">Product Category *</Label>
                  <Select name="productCategory" defaultValue={editingSale?.productCategory || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="imitation">Imitation</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weightGrams">Weight (Grams)</Label>
                  <Input
                    id="weightGrams"
                    name="weightGrams"
                    type="number"
                    step="0.001"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.weightGrams || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="ratePerGram">Rate per Gram</Label>
                  <Input
                    id="ratePerGram"
                    name="ratePerGram"
                    type="number"
                    step="0.01"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.ratePerGram || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="makingCharges">Making Charges</Label>
                  <Input
                    id="makingCharges"
                    name="makingCharges"
                    type="number"
                    step="0.01"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.makingCharges || "0"}
                  />
                </div>
                <div>
                  <Label htmlFor="gemstonesCost">Gemstones Cost</Label>
                  <Input
                    id="gemstonesCost"
                    name="gemstonesCost"
                    type="number"
                    step="0.01"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.gemstonesCost || "0"}
                  />
                </div>
                <div>
                  <Label htmlFor="diamondsCost">Diamonds Cost</Label>
                  <Input
                    id="diamondsCost"
                    name="diamondsCost"
                    type="number"
                    step="0.01"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.diamondsCost || "0"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gstPercentage">GST %</Label>
                  <Input
                    id="gstPercentage"
                    name="gstPercentage"
                    type="number"
                    step="0.01"
                    onChange={calculateTotal}
                    defaultValue={editingSale?.gstPercentage || "3"}
                  />
                </div>
                <div>
                  <Label htmlFor="gstAmount">GST Amount</Label>
                  <Input
                    id="gstAmount"
                    name="gstAmount"
                    type="number"
                    step="0.01"
                    readOnly
                    defaultValue={editingSale?.gstAmount || "0"}
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingSale?.totalAmount || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="paymentMode">Payment Mode *</Label>
                  <Select name="paymentMode" defaultValue={editingSale?.paymentMode || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billNumber">Bill/Invoice Number *</Label>
                  <Input
                    id="billNumber"
                    name="billNumber"
                    required
                    defaultValue={editingSale?.billNumber || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="saleDate">Sale Date *</Label>
                  <Input
                    id="saleDate"
                    name="saleDate"
                    type="datetime-local"
                    required
                    defaultValue={
                      editingSale?.saleDate 
                        ? format(new Date(editingSale.saleDate), "yyyy-MM-dd'T'HH:mm")
                        : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveSaleMutation.isPending}>
                  {saveSaleMutation.isPending ? "Saving..." : editingSale ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="imitation">Imitation</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={filters.paymentMode} onValueChange={(value) => setFilters({ ...filters, paymentMode: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Payment Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search customer, product..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Sales</CardTitle>
          <CardDescription>
            {sales.length} total sales found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{sale.billNumber}</TableCell>
                    <TableCell>
                      {sale.customerName || "Walk-in Customer"}
                      {sale.mobileNumber && (
                        <div className="text-sm text-muted-foreground">
                          {sale.mobileNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sale.productCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.weightGrams ? `${sale.weightGrams}g` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {sale.paymentMode.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{parseFloat(sale.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSale(sale);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSaleMutation.mutate(sale.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}