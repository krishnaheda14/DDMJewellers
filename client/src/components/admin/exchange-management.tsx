import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, XCircle, Clock, Eye, FileText, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface ExchangeRequest {
  id: number;
  userId: string;
  orderId: number | null;
  jewelryPhotoUrl: string;
  billPhotoUrl: string;
  description: string | null;
  estimatedValue: string | null;
  adminAssignedValue: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
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

export default function ExchangeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // Approval form state
  const [approvalData, setApprovalData] = useState({
    adminAssignedValue: "",
    adminNotes: "",
  });

  // Rejection form state
  const [rejectionData, setRejectionData] = useState({
    rejectionReason: "",
  });

  // Fetch exchange requests
  const { data: exchangeRequests = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/exchange/requests", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      return fetch(`/api/exchange/requests?${params.toString()}`).then(res => res.json());
    },
    retry: false,
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("POST", `/api/exchange/requests/${id}/approve`, data);
    },
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: "The jewelry exchange request has been approved successfully.",
      });
      setApprovalDialogOpen(false);
      setApprovalData({ adminAssignedValue: "", adminNotes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/requests"] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve the request",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("POST", `/api/exchange/requests/${id}/reject`, data);
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The jewelry exchange request has been rejected.",
      });
      setRejectionDialogOpen(false);
      setRejectionData({ rejectionReason: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/requests"] });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject the request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: ExchangeRequest) => {
    setSelectedRequest(request);
    setApprovalData({
      adminAssignedValue: request.estimatedValue || "",
      adminNotes: "",
    });
    setApprovalDialogOpen(true);
  };

  const handleReject = (request: ExchangeRequest) => {
    setSelectedRequest(request);
    setRejectionData({ rejectionReason: "" });
    setRejectionDialogOpen(true);
  };

  const submitApproval = () => {
    if (!selectedRequest || !approvalData.adminAssignedValue) {
      toast({
        title: "Missing Information",
        description: "Please provide an assigned value for the jewelry.",
        variant: "destructive",
      });
      return;
    }

    approveRequestMutation.mutate({
      id: selectedRequest.id,
      data: approvalData,
    });
  };

  const submitRejection = () => {
    if (!selectedRequest || !rejectionData.rejectionReason) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    rejectRequestMutation.mutate({
      id: selectedRequest.id,
      data: rejectionData,
    });
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

  const filteredRequests = exchangeRequests.filter((request: ExchangeRequest) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Exchange Requests</h3>
          <p className="text-gray-600">Manage jewelry exchange requests from customers</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
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
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Exchange Requests</h3>
            <p className="text-gray-600">No jewelry exchange requests match the current filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request: ExchangeRequest) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">#{request.id}</span>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium">
                    {request.user.firstName} {request.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{request.user.email}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(request.createdAt), "MMM dd, yyyy")}
                  </div>
                  {request.estimatedValue && (
                    <div className="text-sm text-blue-600">
                      Customer Estimate: ₹{request.estimatedValue}
                    </div>
                  )}
                  {request.adminAssignedValue && (
                    <div className="text-sm font-medium text-green-600">
                      Approved Value: ₹{request.adminAssignedValue}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
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
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Exchange Request #{selectedRequest?.id}</DialogTitle>
                        <DialogDescription>
                          Submitted by {selectedRequest?.user.firstName} {selectedRequest?.user.lastName} on{' '}
                          {selectedRequest && format(new Date(selectedRequest.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedRequest && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Status:</span>
                              {getStatusBadge(selectedRequest.status)}
                            </div>
                            {selectedRequest.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleApprove(selectedRequest)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  onClick={() => handleReject(selectedRequest)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">Customer Information</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Name:</strong> {selectedRequest.user.firstName} {selectedRequest.user.lastName}</div>
                                <div><strong>Email:</strong> {selectedRequest.user.email}</div>
                                {selectedRequest.orderId && (
                                  <div><strong>Order ID:</strong> #{selectedRequest.orderId}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Request Details</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Submitted:</strong> {format(new Date(selectedRequest.createdAt), "MMM dd, yyyy 'at' h:mm a")}</div>
                                {selectedRequest.estimatedValue && (
                                  <div><strong>Customer Estimate:</strong> ₹{selectedRequest.estimatedValue}</div>
                                )}
                                {selectedRequest.adminAssignedValue && (
                                  <div><strong>Approved Value:</strong> ₹{selectedRequest.adminAssignedValue}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Jewelry Photo</h4>
                              <img 
                                src={selectedRequest.jewelryPhotoUrl} 
                                alt="Jewelry" 
                                className="w-full h-64 object-cover rounded-lg border"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Bill Photo</h4>
                              <img 
                                src={selectedRequest.billPhotoUrl} 
                                alt="Bill" 
                                className="w-full h-64 object-cover rounded-lg border"
                              />
                            </div>
                          </div>

                          {selectedRequest.description && (
                            <div>
                              <h4 className="font-medium mb-2">Customer Description</h4>
                              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {selectedRequest.description}
                              </p>
                            </div>
                          )}

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

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApprove(request)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleReject(request)}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Exchange Request</DialogTitle>
            <DialogDescription>
              Set the approved value for this jewelry exchange request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminAssignedValue">Approved Value (₹) *</Label>
              <Input
                id="adminAssignedValue"
                placeholder="Enter approved value"
                value={approvalData.adminAssignedValue}
                onChange={(e) => setApprovalData({ ...approvalData, adminAssignedValue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes about the valuation"
                value={approvalData.adminNotes}
                onChange={(e) => setApprovalData({ ...approvalData, adminNotes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitApproval}
                disabled={approveRequestMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveRequestMutation.isPending ? "Approving..." : "Approve Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exchange Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this exchange request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejection"
                value={rejectionData.rejectionReason}
                onChange={(e) => setRejectionData({ ...rejectionData, rejectionReason: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitRejection}
                disabled={rejectRequestMutation.isPending}
                variant="destructive"
              >
                {rejectRequestMutation.isPending ? "Rejecting..." : "Reject Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}