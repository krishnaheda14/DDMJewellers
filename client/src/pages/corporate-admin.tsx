import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, Users, CheckCircle, XCircle, Clock, Eye, 
  Shield, Wrench, Calendar, Star, TrendingUp 
} from "lucide-react";
import { format } from "date-fns";

export default function CorporateAdmin() {
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch corporate registrations
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["/api/corporate/registrations"],
    enabled: isAuthenticated,
  });

  // Fetch maintenance schedules
  const { data: maintenanceSchedules = [] } = useQuery({
    queryKey: ["/api/corporate/maintenance/schedules"],
    enabled: isAuthenticated,
  });

  // Approve registration mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/corporate/registrations/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/registrations"] });
      toast({
        title: "Registration Approved",
        description: "Corporate registration has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the registration.",
        variant: "destructive",
      });
    },
  });

  // Reject registration mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/corporate/registrations/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/registrations"] });
      toast({
        title: "Registration Rejected",
        description: "Corporate registration has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the registration.",
        variant: "destructive",
      });
    },
  });

  // Complete maintenance mutation
  const completeMaintenance = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest("PATCH", `/api/corporate/maintenance/${id}/complete`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/maintenance/schedules"] });
      toast({
        title: "Maintenance Completed",
        description: "Maintenance service has been marked as completed.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update maintenance status.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <Shield className="mx-auto h-12 w-12 text-amber-600 mb-4" />
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>
                Please log in with admin credentials to access corporate management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = "/auth"}>
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRegistrations = registrations.filter((r: any) => r.status === "pending");
  const approvedRegistrations = registrations.filter((r: any) => r.status === "approved");
  const rejectedRegistrations = registrations.filter((r: any) => r.status === "rejected");

  const scheduledMaintenance = maintenanceSchedules.filter((m: any) => m.status === "scheduled");
  const completedMaintenance = maintenanceSchedules.filter((m: any) => m.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Corporate Partnership Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Manage corporate registrations, employee benefits, and maintenance services
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRegistrations.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedRegistrations.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Approved companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scheduledMaintenance.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Services pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{registrations.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registrations">Corporate Registrations</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance Services</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Corporate Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Corporate Registrations
                </CardTitle>
                <CardDescription>
                  Review and manage corporate partnership applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading registrations...</div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No corporate registrations found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((registration: any) => (
                        <TableRow key={registration.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{registration.companyName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {registration.registrationNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{registration.contactPersonName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {registration.contactPersonEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{registration.approximateEmployees}</TableCell>
                          <TableCell>{getStatusBadge(registration.status)}</TableCell>
                          <TableCell>
                            {format(new Date(registration.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedRegistration(registration)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Corporate Registration Details</DialogTitle>
                                    <DialogDescription>
                                      Review the complete registration information
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedRegistration && (
                                    <div className="space-y-6">
                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <h3 className="font-semibold mb-2">Company Information</h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Name:</strong> {selectedRegistration.companyName}</div>
                                            <div><strong>Registration #:</strong> {selectedRegistration.registrationNumber}</div>
                                            {selectedRegistration.gstin && (
                                              <div><strong>GSTIN:</strong> {selectedRegistration.gstin}</div>
                                            )}
                                            <div><strong>Employees:</strong> {selectedRegistration.approximateEmployees}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <h3 className="font-semibold mb-2">Contact Information</h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Contact Person:</strong> {selectedRegistration.contactPersonName}</div>
                                            <div><strong>Phone:</strong> {selectedRegistration.contactPersonPhone}</div>
                                            <div><strong>Email:</strong> {selectedRegistration.contactPersonEmail}</div>
                                            <div><strong>Company Email:</strong> {selectedRegistration.companyEmail}</div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h3 className="font-semibold mb-2">Company Address</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                          {selectedRegistration.companyAddress}
                                        </p>
                                      </div>

                                      <div>
                                        <h3 className="font-semibold mb-2">Purpose of Partnership</h3>
                                        <div className="flex flex-wrap gap-2">
                                          {JSON.parse(selectedRegistration.purposeOfTieup || "[]").map((purpose: string) => (
                                            <Badge key={purpose} variant="secondary">
                                              {purpose.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      {selectedRegistration.status === "pending" && (
                                        <div className="flex gap-4 pt-4">
                                          <Button 
                                            onClick={() => approveMutation.mutate(selectedRegistration.id)}
                                            disabled={approveMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button 
                                            variant="destructive"
                                            onClick={() => rejectMutation.mutate(selectedRegistration.id)}
                                            disabled={rejectMutation.isPending}
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                          </Button>
                                        </div>
                                      )}

                                      {selectedRegistration.status === "approved" && (
                                        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                          <AlertDescription className="text-green-700 dark:text-green-300">
                                            <strong>Corporate Code:</strong> {selectedRegistration.corporateCode}
                                            <br />
                                            <strong>Approved on:</strong> {format(new Date(selectedRegistration.approvedAt), "MMM dd, yyyy")}
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {registration.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveMutation.mutate(registration.id)}
                                    disabled={approveMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectMutation.mutate(registration.id)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Services Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-6 w-6" />
                  Maintenance Services
                </CardTitle>
                <CardDescription>
                  Manage employee maintenance schedules and service completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No maintenance schedules found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Corporate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceSchedules.map((schedule: any) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-blue-600" />
                              {schedule.serviceType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(schedule.scheduledDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">Corporate ID: {schedule.corporateId}</div>
                              <div className="text-gray-500 dark:text-gray-400">User: {schedule.userId}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getMaintenanceStatusBadge(schedule.status)}</TableCell>
                          <TableCell>
                            {schedule.status === "scheduled" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const notes = prompt("Enter completion notes (optional):");
                                  if (notes !== null) {
                                    completeMaintenance.mutate({ id: schedule.id, notes: notes || "" });
                                  }
                                }}
                                disabled={completeMaintenance.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                            {schedule.status === "completed" && schedule.notes && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Notes: {schedule.notes}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    Registration Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {pendingRegistrations.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Approved Partners</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {approvedRegistrations.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rejected Applications</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {rejectedRegistrations.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Applications</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {registrations.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Maintenance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Scheduled Services</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {scheduledMaintenance.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed Services</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {completedMaintenance.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Services</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {maintenanceSchedules.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}