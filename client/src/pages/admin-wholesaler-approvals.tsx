import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserCheck, UserX, Building, Calendar, Phone, MapPin } from "lucide-react";

interface PendingWholesaler {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  gst_number: string;
  years_in_business: number;
  average_order_value: string;
  business_references: string;
  created_at: string;
}

export default function AdminWholesalerApprovals() {
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedWholesaler, setSelectedWholesaler] = useState<PendingWholesaler | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending wholesalers
  const { data: pendingWholesalers, isLoading } = useQuery({
    queryKey: ["/api/admin/wholesalers/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/wholesalers/pending");
      if (!response.ok) {
        throw new Error("Failed to fetch pending wholesalers");
      }
      return response.json();
    },
  });

  // Approve wholesaler mutation
  const approveMutation = useMutation({
    mutationFn: async (wholesalerId: string) => {
      const response = await apiRequest("POST", `/api/admin/wholesalers/${wholesalerId}/approve`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to approve wholesaler");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Wholesaler Approved",
        description: `${data.wholesaler.first_name} ${data.wholesaler.last_name} has been approved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wholesalers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject wholesaler mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ wholesalerId, reason }: { wholesalerId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/wholesalers/${wholesalerId}/reject`, {
        reason,
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to reject wholesaler");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Application Rejected",
        description: `${data.wholesaler.first_name} ${data.wholesaler.last_name}'s application has been rejected.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wholesalers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setRejectionReason("");
      setSelectedWholesaler(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (wholesalerId: string) => {
    approveMutation.mutate(wholesalerId);
  };

  const handleReject = () => {
    if (selectedWholesaler && rejectionReason.trim()) {
      rejectMutation.mutate({
        wholesalerId: selectedWholesaler.id,
        reason: rejectionReason.trim(),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-blue-800 dark:text-blue-200">Loading Wholesaler Applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Wholesaler Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and manage pending wholesaler applications
          </p>
        </div>

        {!pendingWholesalers || pendingWholesalers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Pending Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All wholesaler applications have been processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingWholesalers.map((wholesaler: PendingWholesaler) => (
              <Card key={wholesaler.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      {wholesaler.business_name}
                    </CardTitle>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Contact:</span>
                      <span className="ml-2">
                        {wholesaler.first_name} {wholesaler.last_name}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{wholesaler.email}</span>
                    </div>
                    {wholesaler.business_phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{wholesaler.business_phone}</span>
                      </div>
                    )}
                    {wholesaler.business_address && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{wholesaler.business_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {wholesaler.gst_number && (
                      <div>
                        <span className="font-medium">GST:</span>
                        <p className="text-gray-600 dark:text-gray-300">{wholesaler.gst_number}</p>
                      </div>
                    )}
                    {wholesaler.years_in_business && (
                      <div>
                        <span className="font-medium">Experience:</span>
                        <p className="text-gray-600 dark:text-gray-300">
                          {wholesaler.years_in_business} years
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    Applied on {new Date(wholesaler.created_at).toLocaleDateString()}
                  </div>

                  <div className="pt-4 space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          View Full Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{wholesaler.business_name} - Application Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="font-medium">Business Name</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.business_name}</p>
                            </div>
                            <div>
                              <label className="font-medium">Contact Person</label>
                              <p className="text-gray-600 dark:text-gray-300">
                                {wholesaler.first_name} {wholesaler.last_name}
                              </p>
                            </div>
                            <div>
                              <label className="font-medium">Email</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.email}</p>
                            </div>
                            <div>
                              <label className="font-medium">Phone</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.business_phone || "Not provided"}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="font-medium">Business Address</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.business_address || "Not provided"}</p>
                            </div>
                            <div>
                              <label className="font-medium">GST Number</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.gst_number || "Not provided"}</p>
                            </div>
                            <div>
                              <label className="font-medium">Years in Business</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.years_in_business || "Not specified"}</p>
                            </div>
                            <div>
                              <label className="font-medium">Average Order Value</label>
                              <p className="text-gray-600 dark:text-gray-300">{wholesaler.average_order_value || "Not specified"}</p>
                            </div>
                          </div>
                          {wholesaler.business_references && (
                            <div>
                              <label className="font-medium">Business References</label>
                              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {wholesaler.business_references}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(wholesaler.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => setSelectedWholesaler(wholesaler)}
                            disabled={rejectMutation.isPending}
                            className="flex-1"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Application</AlertDialogTitle>
                            <AlertDialogDescription>
                              Please provide a reason for rejecting {wholesaler.first_name} {wholesaler.last_name}'s application.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setRejectionReason("");
                              setSelectedWholesaler(null);
                            }}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleReject}
                              disabled={!rejectionReason.trim() || rejectMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}