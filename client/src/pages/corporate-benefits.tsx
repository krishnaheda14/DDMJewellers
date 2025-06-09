import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, Gift, Wrench, Star, CheckCircle, Shield, Clock, Tag, Home, ArrowLeft } from "lucide-react";
import { z } from "zod";

const verifyCodeSchema = z.object({
  corporateCode: z.string().min(1, "Corporate code is required"),
});

const enrollmentSchema = z.object({
  corporateCode: z.string().min(1, "Corporate code is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
});

type VerifyCodeData = z.infer<typeof verifyCodeSchema>;
type EnrollmentData = z.infer<typeof enrollmentSchema>;

export default function CorporateBenefits() {
  const [verifiedCorporate, setVerifiedCorporate] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const verifyForm = useForm<VerifyCodeData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      corporateCode: "",
    },
  });

  const enrollForm = useForm<EnrollmentData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      corporateCode: verifiedCorporate?.corporateCode || "",
      employeeId: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyCodeData) => {
      const response = await apiRequest("POST", "/api/corporate/verify-code", data);
      return response;
    },
    onSuccess: (data) => {
      setVerifiedCorporate(data);
      enrollForm.setValue("corporateCode", data.corporate.corporateCode);
      toast({
        title: "Corporate Code Verified",
        description: `Welcome! You're eligible for ${data.corporate.companyName} employee benefits.`,
      });
    },
    onError: () => {
      toast({
        title: "Invalid Corporate Code",
        description: "Please check your corporate code and try again.",
        variant: "destructive",
      });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: EnrollmentData) => {
      return await apiRequest("POST", "/api/corporate/maintenance/enroll", data);
    },
    onSuccess: () => {
      setIsEnrolled(true);
      toast({
        title: "Enrollment Successful",
        description: "You've been enrolled in the free maintenance program!",
      });
    },
    onError: () => {
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling you in the maintenance program.",
        variant: "destructive",
      });
    },
  });

  const onVerifySubmit = (data: VerifyCodeData) => {
    verifyMutation.mutate(data);
  };

  const onEnrollSubmit = (data: EnrollmentData) => {
    enrollMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <Shield className="mx-auto h-12 w-12 text-amber-600 mb-4" />
              <CardTitle>Login Required</CardTitle>
              <CardDescription>
                Please log in to access corporate employee benefits
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
          >
            <Home className="h-4 w-4" />
            DDM Jewellers
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Corporate Employee Benefits
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Access exclusive discounts and free maintenance services with your corporate code
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Tag className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Special Discounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Free Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Priority Service</span>
            </div>
          </div>
        </div>

        {/* Corporate Code Verification */}
        {!verifiedCorporate && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Verify Corporate Code
              </CardTitle>
              <CardDescription>
                Enter the corporate code provided by your company to access exclusive benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
                  <FormField
                    control={verifyForm.control}
                    name="corporateCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corporate Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your corporate code (e.g., CORP1234567890)"
                            className="text-center font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Verified Corporate Benefits */}
        {verifiedCorporate && (
          <div className="space-y-8">
            {/* Corporate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-6 w-6" />
                  Corporate Code Verified
                </CardTitle>
                <CardDescription>
                  Welcome to {verifiedCorporate.corporate.companyName} employee benefits program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Company Details</h3>
                    <p className="text-gray-600 dark:text-gray-300">{verifiedCorporate.corporate.companyName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Code: {verifiedCorporate.corporate.corporateCode}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Benefits</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {verifiedCorporate.benefits.discountPercentage}% Discount
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Free Maintenance
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Benefits */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <Tag className="mx-auto h-12 w-12 text-amber-600 mb-2" />
                  <CardTitle className="text-lg">Special Discounts</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    {verifiedCorporate.benefits.discountPercentage}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Off on all jewelry purchases. Discount automatically applied at checkout.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Wrench className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Free Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1x</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Free annual jewelry cleaning, polishing, and minor repairs.
                  </p>
                  {!isEnrolled && (
                    <Button 
                      size="sm" 
                      className="mt-4 w-full"
                      onClick={() => document.getElementById('enrollment-form')?.scrollIntoView()}
                    >
                      Enroll Now
                    </Button>
                  )}
                  {isEnrolled && (
                    <Badge className="mt-4 bg-green-100 text-green-800">
                      Enrolled
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Priority Service</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">24h</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Fast-track processing and dedicated customer support.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance Enrollment */}
            {!isEnrolled && (
              <Card id="enrollment-form">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Free Maintenance Enrollment
                  </CardTitle>
                  <CardDescription>
                    Enroll in our free annual maintenance program for your jewelry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...enrollForm}>
                    <form onSubmit={enrollForm.handleSubmit(onEnrollSubmit)} className="space-y-4">
                      <FormField
                        control={enrollForm.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your employee ID"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          What's Included in Free Maintenance:
                        </h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Professional jewelry cleaning</li>
                          <li>• Polishing to restore shine</li>
                          <li>• Minor repairs (loose stones, broken chains)</li>
                          <li>• Quality inspection and assessment</li>
                          <li>• One service per year per employee</li>
                        </ul>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? "Enrolling..." : "Enroll in Free Maintenance"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Enrollment Success */}
            {isEnrolled && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-6 w-6" />
                    Successfully Enrolled!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      You're now enrolled in the free maintenance program. You can schedule your 
                      maintenance service by contacting our customer support or visiting our store.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Next Steps:</h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Contact us to schedule maintenance</li>
                        <li>• Bring your jewelry and employee ID</li>
                        <li>• Service typically takes 2-3 business days</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information:</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Phone: +91 98765 43210<br />
                        Email: maintenance@ddmjewellers.com<br />
                        Store hours: 10 AM - 8 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shopping with Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6" />
                  Start Shopping with Benefits
                </CardTitle>
                <CardDescription>
                  Your corporate discount will be automatically applied at checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.location.href = "/products"}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Browse Jewelry
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = "/custom-jewelry"}
                  >
                    Custom Designs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Information for Companies */}
        <Card className="mt-12 bg-gray-50 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="text-center">Is Your Company Interested?</CardTitle>
            <CardDescription className="text-center">
              Join our Corporate Gifting & Employee Privileges Program
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Partner with DDM Jewellers to offer exclusive benefits to your employees. 
              From bulk gifting to personal discounts and free maintenance services.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/corporate-registration"}
            >
              Learn More About Corporate Partnership
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}