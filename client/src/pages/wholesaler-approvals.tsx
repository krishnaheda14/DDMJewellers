import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, Check, X, Building2, Phone, Mail, MapPin, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PendingWholesaler {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  gst_number: string;
  created_at: string;
}

export default function WholesalerApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending wholesaler applications
  const { data: pendingWholesalers, isLoading } = useQuery<PendingWholesaler[]>({
    queryKey: ['/api/admin/wholesalers/pending'],
  });

  // Approve wholesaler mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/admin/wholesalers/${userId}/approve`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wholesalers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Show login credentials if they were generated
      if (data.loginCredentials) {
        toast({
          title: 'Wholesaler Approved Successfully',
          description: `Login credentials created:
Email: ${data.loginCredentials.email}
Password: ${data.loginCredentials.password}
${data.loginCredentials.note}`,
          duration: 10000, // Show for 10 seconds
        });
      } else {
        toast({
          title: 'Wholesaler Approved',
          description: 'The wholesaler application has been approved successfully.',
        });
      }
      setProcessingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to approve wholesaler application.',
        variant: 'destructive',
      });
      setProcessingId(null);
    },
  });

  // Reject wholesaler mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/admin/wholesalers/${userId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wholesalers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Wholesaler Rejected',
        description: 'The wholesaler application has been rejected.',
      });
      setProcessingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reject wholesaler application.',
        variant: 'destructive',
      });
      setProcessingId(null);
    },
  });

  const handleApprove = (userId: string) => {
    setProcessingId(userId);
    approveMutation.mutate(userId);
  };

  const handleReject = (userId: string) => {
    setProcessingId(userId);
    rejectMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Wholesaler Approvals</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Wholesaler Approvals</h1>
        <Badge variant="secondary" className="ml-auto">
          {pendingWholesalers?.length || 0} Pending
        </Badge>
      </div>

      {!pendingWholesalers || pendingWholesalers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
            <p className="text-gray-600 text-center">
              All wholesaler applications have been processed. New applications will appear here for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingWholesalers.map((wholesaler) => (
            <Card key={wholesaler.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {wholesaler.business_name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Applied {new Date(wholesaler.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{wholesaler.first_name} {wholesaler.last_name}</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-6">{wholesaler.email}</div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{wholesaler.business_phone}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-600">{wholesaler.business_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      GST: {wholesaler.gst_number}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(wholesaler.id)}
                    disabled={processingId === wholesaler.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingId === wholesaler.id && approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleReject(wholesaler.id)}
                    disabled={processingId === wholesaler.id}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {processingId === wholesaler.id && rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}