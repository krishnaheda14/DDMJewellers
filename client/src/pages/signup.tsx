import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gem, Store, User, ArrowLeft } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["customer", "wholesaler"], {
    required_error: "Please select an account type",
  }),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessDescription: z.string().optional(),
}).refine((data) => {
  if (data.role === "wholesaler") {
    return data.businessName && data.businessName.length >= 2;
  }
  return true;
}, {
  message: "Business name is required for wholesaler accounts",
  path: ["businessName"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const selectedRole = watch("role");

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created Successfully",
        description: selectedRole === "wholesaler" 
          ? "Your wholesaler account is pending approval. You'll receive an email once approved."
          : "Welcome to DDM Jewellers! You can now start exploring our collections.",
      });
      // Redirect to login
      window.location.href = "/api/login";
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold/10 to-deep-navy/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Gem className="h-8 w-8 text-gold mr-2" />
            <h1 className="text-2xl font-bold text-deep-navy">
              <span className="text-gold">DDM</span> Jewellers
            </h1>
          </div>
          <CardTitle className="text-2xl text-deep-navy">Create Your Account</CardTitle>
          <p className="text-muted-foreground">
            Join our exclusive jewelry community
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                {/* Account Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Choose Account Type</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setValue("role", value as "customer" | "wholesaler")}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="customer" id="customer" />
                      <User className="h-5 w-5 text-gold" />
                      <div className="flex-1">
                        <Label htmlFor="customer" className="font-medium cursor-pointer">
                          Customer Account
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Browse and purchase jewelry, access personalized recommendations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="wholesaler" id="wholesaler" />
                      <Store className="h-5 w-5 text-gold" />
                      <div className="flex-1">
                        <Label htmlFor="wholesaler" className="font-medium cursor-pointer">
                          Wholesaler Account
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Upload custom designs for approval, business partnerships
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {selectedRole && (
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="w-full bg-gold hover:bg-gold/90"
                    disabled={!selectedRole}
                  >
                    Continue
                  </Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="p-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {selectedRole === "wholesaler" ? "Business Information" : "Complete Registration"}
                  </h3>
                </div>

                {selectedRole === "wholesaler" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        {...register("businessName")}
                        placeholder="Enter your business name"
                      />
                      {errors.businessName && (
                        <p className="text-sm text-destructive">{errors.businessName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input
                        id="businessAddress"
                        {...register("businessAddress")}
                        placeholder="Enter your business address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <Textarea
                        id="businessDescription"
                        {...register("businessDescription")}
                        placeholder="Tell us about your business and jewelry specialization"
                        rows={3}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Wholesaler Account Benefits:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Upload custom jewelry designs for approval</li>
                        <li>• Access to wholesale pricing and bulk orders</li>
                        <li>• Direct communication with DDM Jewellers team</li>
                        <li>• Priority support for business inquiries</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> {selectedRole === "wholesaler" 
                      ? "Wholesaler accounts require manual approval. You'll receive an email notification once your account is reviewed and approved by our team."
                      : "By creating an account, you agree to our Terms of Service and Privacy Policy."
                    }
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gold hover:bg-gold/90"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending 
                    ? "Creating Account..." 
                    : selectedRole === "wholesaler" 
                      ? "Submit for Approval" 
                      : "Create Account"
                  }
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-gold hover:text-gold/80"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}