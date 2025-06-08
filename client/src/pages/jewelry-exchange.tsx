import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Upload, CheckCircle, XCircle, Clock, Eye, FileText, Home, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface ExchangeRequest {
  id: number;
  orderId: number | null;
  jewelryPhotoUrl: string;
  billPhotoUrl: string;
  description: string | null;
  estimatedValue: string | null;
  adminAssignedValue: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  order?: {
    id: number;
    status: string;
    totalAmount: string;
    createdAt: Date;
  };
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function JewelryExchange() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("submit");
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);

  // Form state for new exchange request
  const [formData, setFormData] = useState({
    orderId: "",
    jewelryPhotoUrl: "",
    billPhotoUrl: "",
    description: "",
    estimatedValue: "",
  });

  // Fetch user's exchange requests
  const { data: exchangeRequests = [], isLoading } = useQuery({
    queryKey: ["/api/exchange/requests"],
    retry: false,
  });

  // Create exchange request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/exchange/requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Exchange Request Submitted",
        description: "Your jewelry exchange request has been submitted for review.",
      });
      setFormData({
        orderId: "",
        jewelryPhotoUrl: "",
        billPhotoUrl: "",
        description: "",
        estimatedValue: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/requests"] });
      setActiveTab("history");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit exchange request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jewelryPhotoUrl || !formData.billPhotoUrl) {
      toast({
        title: "Missing Photos",
        description: "Please upload both jewelry and bill photos",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Jewelry Exchange Program</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exchange your old hallmarked jewelry for new pieces. Get fair value assessments from our experts.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit Request</TabsTrigger>
            <TabsTrigger value="history">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Submit Exchange Request
                </CardTitle>
                <CardDescription>
                  Upload photos of your hallmarked jewelry and original purchase bill for valuation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order ID (Optional)</Label>
                      <Input
                        id="orderId"
                        placeholder="Enter order ID if exchanging during purchase"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Your Estimated Value (₹)</Label>
                      <Input
                        id="estimatedValue"
                        placeholder="Enter your estimated value"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jewelryPhotoUrl">Jewelry Photo URL *</Label>
                    <Input
                      id="jewelryPhotoUrl"
                      placeholder="Upload jewelry photo and paste URL here"
                      value={formData.jewelryPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, jewelryPhotoUrl: e.target.value })}
                      required
                    />
                    {formData.jewelryPhotoUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.jewelryPhotoUrl} 
                          alt="Jewelry" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billPhotoUrl">Original Bill Photo URL *</Label>
                    <Input
                      id="billPhotoUrl"
                      placeholder="Upload bill photo and paste URL here"
                      value={formData.billPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, billPhotoUrl: e.target.value })}
                      required
                    />
                    {formData.billPhotoUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.billPhotoUrl} 
                          alt="Bill" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your jewelry (metal type, weight, stones, etc.)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? "Submitting..." : "Submit Exchange Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Exchange History</h2>
                <Badge variant="outline" className="text-sm">
                  {exchangeRequests.length} request{exchangeRequests.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : exchangeRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Exchange Requests</h3>
                    <p className="text-gray-600 mb-4">You haven't submitted any jewelry exchange requests yet.</p>
                    <Button onClick={() => setActiveTab("submit")}>
                      Submit Your First Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exchangeRequests.map((request: ExchangeRequest) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-500">#{request.id}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(request.createdAt), "MMM dd, yyyy")}
                          </div>
                          {request.estimatedValue && (
                            <div className="text-sm text-gray-600">
                              Your Estimate: ₹{request.estimatedValue}
                            </div>
                          )}
                          {request.adminAssignedValue && (
                            <div className="text-sm font-medium text-green-600">
                              Approved Value: ₹{request.adminAssignedValue}
                            </div>
                          )}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Exchange Request #{selectedRequest?.id}</DialogTitle>
                              <DialogDescription>
                                Submitted on {selectedRequest && format(new Date(selectedRequest.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Status:</span>
                                  {getStatusBadge(selectedRequest.status)}
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Jewelry Photo</h4>
                                    <img 
                                      src={selectedRequest.jewelryPhotoUrl} 
                                      alt="Jewelry" 
                                      className="w-full h-48 object-cover rounded-lg border"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Bill Photo</h4>
                                    <img 
                                      src={selectedRequest.billPhotoUrl} 
                                      alt="Bill" 
                                      className="w-full h-48 object-cover rounded-lg border"
                                    />
                                  </div>
                                </div>

                                {selectedRequest.description && (
                                  <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                      {selectedRequest.description}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedRequest.estimatedValue && (
                                    <div>
                                      <h4 className="font-medium mb-1">Your Estimated Value</h4>
                                      <p className="text-lg font-semibold text-blue-600">₹{selectedRequest.estimatedValue}</p>
                                    </div>
                                  )}
                                  {selectedRequest.adminAssignedValue && (
                                    <div>
                                      <h4 className="font-medium mb-1">Approved Value</h4>
                                      <p className="text-lg font-semibold text-green-600">₹{selectedRequest.adminAssignedValue}</p>
                                    </div>
                                  )}
                                </div>

                                {selectedRequest.adminNotes && (
                                  <div>
                                    <h4 className="font-medium mb-2">Admin Notes</h4>
                                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                      {selectedRequest.adminNotes}
                                    </p>
                                  </div>
                                )}

                                {selectedRequest.rejectionReason && (
                                  <div>
                                    <h4 className="font-medium mb-2">Rejection Reason</h4>
                                    <p className="text-red-600 bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                                      {selectedRequest.rejectionReason}
                                    </p>
                                  </div>
                                )}

                                {selectedRequest.reviewedAt && selectedRequest.reviewer && (
                                  <div className="text-sm text-gray-500">
                                    Reviewed by {selectedRequest.reviewer.firstName} {selectedRequest.reviewer.lastName} on{' '}
                                    {format(new Date(selectedRequest.reviewedAt), "MMMM dd, yyyy 'at' h:mm a")}
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}