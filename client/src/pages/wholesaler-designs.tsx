import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Tag,
  Package
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface WholesalerDesign {
  id: number;
  wholesalerId: string;
  name: string;
  description?: string;
  category?: string;
  productType: "real" | "imitation";
  material?: string;
  weight?: number;
  purity?: string;
  price?: number;
  makingCharges?: number;
  gemstonesCost?: number;
  diamondsCost?: number;
  tags?: string[];
  status: "pending_approval" | "approved" | "rejected";
  uploadedAt: string;
  images?: string[];
}

const statusConfig = {
  pending_approval: { 
    label: "Pending Review", 
    icon: Clock, 
    variant: "secondary" as const,
    color: "text-yellow-600" 
  },
  approved: { 
    label: "Approved", 
    icon: CheckCircle, 
    variant: "default" as const,
    color: "text-green-600" 
  },
  rejected: { 
    label: "Rejected", 
    icon: XCircle, 
    variant: "destructive" as const,
    color: "text-red-600" 
  }
};

export default function WholesalerDesigns() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch wholesaler's designs
  const { data: designs = [], isLoading, error } = useQuery<WholesalerDesign[]>({
    queryKey: ["/api/wholesaler/products"],
    enabled: !!user?.id,
  });

  // Delete design mutation
  const deleteMutation = useMutation({
    mutationFn: async (designId: number) => {
      const response = await fetch(`/api/wholesaler/products/${designId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete design");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesaler/products"] });
      toast({
        title: "Design deleted",
        description: "Your design has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the design. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (designId: number) => {
    if (confirm("Are you sure you want to delete this design? This action cannot be undone.")) {
      deleteMutation.mutate(designId);
    }
  };

  // Filter designs based on selected tab
  const filteredDesigns = designs.filter(design => {
    if (selectedTab === "all") return true;
    return design.status === selectedTab;
  });

  const getStatusCounts = () => {
    return {
      all: designs.length,
      pending: designs.filter(d => d.status === "pending_approval").length,
      approved: designs.filter(d => d.status === "approved").length,
      rejected: designs.filter(d => d.status === "rejected").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Designs</CardTitle>
            <CardDescription>
              Failed to load your designs. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/wholesaler/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Designs</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your jewelry design submissions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/wholesaler/upload")}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            <Package className="w-4 h-4 mr-2" />
            Upload New Design
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Designs</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Designs List */}
        <Card>
          <CardHeader>
            <CardTitle>Design Management</CardTitle>
            <CardDescription>
              View, edit, and manage your submitted jewelry designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending ({statusCounts.pending})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-6">
                {filteredDesigns.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No designs found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {selectedTab === "all" 
                        ? "You haven't uploaded any designs yet." 
                        : `No ${selectedTab === "pending_approval" ? "pending" : selectedTab} designs to display.`}
                    </p>
                    <Button
                      onClick={() => setLocation("/wholesaler/upload")}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Upload Your First Design
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDesigns.map((design) => {
                      const StatusIcon = statusConfig[design.status].icon;
                      return (
                        <Card key={design.id} className="hover:shadow-lg transition-shadow">
                          <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                            {design.images && design.images.length > 0 ? (
                              <img
                                src={design.images[0]}
                                alt={design.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Image load error:', design.images[0]);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant={statusConfig[design.status].variant}
                                className="flex items-center gap-1"
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[design.status].label}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                                  {design.name}
                                </h3>
                              </div>
                              
                              {design.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {design.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {design.category && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {design.category}
                                  </div>
                                )}
                                {design.price && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ₹{design.price}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {design.uploadedAt ? format(new Date(design.uploadedAt), "MMM dd, yyyy") : "No date"}
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        {design.name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Design details and specifications
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6">
                                      {/* Status and Basic Info */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            const StatusIcon = statusConfig[design.status].icon;
                                            return <StatusIcon className="h-4 w-4" />;
                                          })()}
                                          <Badge variant={statusConfig[design.status].variant}>
                                            {statusConfig[design.status].label}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          ID: {design.id}
                                        </div>
                                      </div>

                                      {/* Description */}
                                      {design.description && (
                                        <div>
                                          <h4 className="font-medium mb-2">Description</h4>
                                          <p className="text-sm text-gray-600">{design.description}</p>
                                        </div>
                                      )}

                                      {/* Product Details */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium mb-2">Product Information</h4>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Type:</span>
                                              <span className="capitalize">{design.productType}</span>
                                            </div>
                                            {design.category && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Category:</span>
                                                <span>{design.category}</span>
                                              </div>
                                            )}
                                            {design.material && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Material:</span>
                                                <span>{design.material}</span>
                                              </div>
                                            )}
                                            {design.purity && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Purity:</span>
                                                <span>{design.purity}</span>
                                              </div>
                                            )}
                                            {design.weight && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Weight:</span>
                                                <span>{design.weight}g</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="font-medium mb-2">Pricing Details</h4>
                                          <div className="space-y-2 text-sm">
                                            {design.price && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Base Price:</span>
                                                <span className="font-medium">₹{design.price}</span>
                                              </div>
                                            )}
                                            {design.makingCharges && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Making Charges:</span>
                                                <span>₹{design.makingCharges}</span>
                                              </div>
                                            )}
                                            {design.gemstonesCost && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Gemstones Cost:</span>
                                                <span>₹{design.gemstonesCost}</span>
                                              </div>
                                            )}
                                            {design.diamondsCost && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Diamonds Cost:</span>
                                                <span>₹{design.diamondsCost}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      {design.tags && design.tags.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-2">Tags</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {design.tags.map((tag, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Upload Information */}
                                      <div className="border-t pt-4">
                                        <h4 className="font-medium mb-2">Upload Information</h4>
                                        <div className="text-sm text-gray-600">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Uploaded on {design.uploadedAt ? format(new Date(design.uploadedAt), "MMMM dd, yyyy 'at' hh:mm a") : "Unknown date"}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Images placeholder */}
                                      {design.images && design.images.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-2">Images</h4>
                                          <div className="grid grid-cols-2 gap-2">
                                            {design.images.map((image, index) => (
                                              <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {design.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(design.id)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}