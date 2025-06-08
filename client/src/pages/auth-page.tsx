import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { LoginLoading } from "@/components/login-loading";
import { 
  customerSignupSchema, 
  wholesalerSignupSchema, 
  signinSchema,
  forgotPasswordSchema,
  type CustomerSignup,
  type WholesalerSignup,
  type Signin,
  type ForgotPassword
} from "@shared/schema";
import { 
  User, 
  Building2, 
  Crown, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield,
  Gem,
  Star,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [userType, setUserType] = useState<"customer" | "wholesaler">("customer");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectUser, setRedirectUser] = useState<any>(null);
  
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      handleRoleBasedRedirect(user);
    }
  }, [user, isLoading]);

  const handleRoleBasedRedirect = (userData: any) => {
    setIsRedirecting(true);
    setRedirectUser(userData);
    
    // Store user session in localStorage for persistence
    localStorage.setItem('ddm_user_session', JSON.stringify({
      id: userData.id,
      role: userData.role,
      timestamp: Date.now()
    }));

    // Delay redirect to show loading animation
    setTimeout(() => {
      switch (userData.role) {
        case "admin":
          setLocation("/admin/dashboard");
          break;
        case "customer":
          setLocation("/customer/dashboard");
          break;
        case "wholesaler":
          setLocation("/wholesaler/dashboard");
          break;
        default:
          setLocation("/");
      }
    }, 2000);
  };

  // Sign In Form
  const signinForm = useForm<Signin>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Customer Signup Form
  const customerForm = useForm<CustomerSignup>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  // Wholesaler Signup Form
  const wholesalerForm = useForm<WholesalerSignup>({
    resolver: zodResolver(wholesalerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      gstNumber: "",
      yearsInBusiness: 1,
      averageOrderValue: "",
      references: "",
    },
  });

  // Forgot Password Form
  const forgotForm = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Sign In Mutation
  const signinMutation = useMutation({
    mutationFn: async (data: Signin) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Sign in failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      // Invalidate auth query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Use role-based redirect with loading animation
      handleRoleBasedRedirect(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Customer Signup Mutation
  const customerSignupMutation = useMutation({
    mutationFn: async (data: CustomerSignup) => {
      const response = await apiRequest("POST", "/api/auth/signup/customer", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account.",
      });
      setAuthMode("signin");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Wholesaler Signup Mutation
  const wholesalerSignupMutation = useMutation({
    mutationFn: async (data: WholesalerSignup) => {
      const response = await apiRequest("POST", "/api/auth/signup/wholesaler", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your wholesaler application is under review. You'll receive an email once approved.",
      });
      setAuthMode("signin");
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forgot Password Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPassword) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to send reset email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      setAuthMode("signin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSignin = (data: Signin) => {
    signinMutation.mutate(data);
  };

  const onCustomerSignup = (data: CustomerSignup) => {
    customerSignupMutation.mutate(data);
  };

  const onWholesalerSignup = (data: WholesalerSignup) => {
    wholesalerSignupMutation.mutate(data);
  };

  const onForgotPassword = (data: ForgotPassword) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                DDM Jewellers
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Crafting memories, one jewel at a time
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Premium Quality</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Handcrafted jewelry with the finest materials and attention to detail
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Certified Authentic</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All our jewelry comes with proper hallmark certification and guarantees
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Trusted Since 1985</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Four decades of expertise in creating exquisite jewelry pieces
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">What our customers say</h4>
            <p className="text-gray-600 dark:text-gray-400 italic">
              "DDM Jewellers created the most beautiful engagement ring. The quality and craftsmanship 
              exceeded our expectations. Highly recommended!"
            </p>
            <p className="text-amber-600 font-medium mt-2">- Priya & Rahul</p>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gem className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {authMode === "signin" && "Welcome Back"}
                {authMode === "signup" && "Join DDM Jewellers"}
                {authMode === "forgot" && "Reset Password"}
              </CardTitle>
              <CardDescription>
                {authMode === "signin" && "Sign in to your account"}
                {authMode === "signup" && "Create your account to get started"}
                {authMode === "forgot" && "Enter your email to reset your password"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {authMode === "signin" && (
                <Form {...signinForm}>
                  <form onSubmit={signinForm.handleSubmit(onSignin)} className="space-y-4">
                    <FormField
                      control={signinForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="your.email@example.com"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signinForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                {...field} 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="pl-10 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff /> : <Eye />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setAuthMode("forgot")}
                        className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      disabled={signinMutation.isPending}
                    >
                      {signinMutation.isPending ? "Signing In..." : "Sign In"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              )}

              {authMode === "signup" && (
                <div className="space-y-6">
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose Account Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("customer")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          userType === "customer"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-amber-300"
                        }`}
                      >
                        <User className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                        <p className="text-sm font-medium">Customer</p>
                        <p className="text-xs text-gray-500">Personal shopping</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setUserType("wholesaler")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          userType === "wholesaler"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-amber-300"
                        }`}
                      >
                        <Building2 className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                        <p className="text-sm font-medium">Wholesaler</p>
                        <p className="text-xs text-gray-500">Business account</p>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Registration Form */}
                  {userType === "customer" && (
                    <Form {...customerForm}>
                      <form onSubmit={customerForm.handleSubmit(onCustomerSignup)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={customerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="John" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Doe" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={customerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    {...field} 
                                    type="email" 
                                    placeholder="your.email@example.com"
                                    className="pl-10"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={customerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+91 98765 43210" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={customerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    {...field} 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    className="pl-10 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={customerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    {...field} 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          disabled={customerSignupMutation.isPending}
                        >
                          {customerSignupMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  )}

                  {/* Wholesaler Registration Form */}
                  {userType === "wholesaler" && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Approval Required
                          </p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Wholesaler accounts require admin approval. You'll receive an email confirmation once your application is reviewed.
                        </p>
                      </div>

                      <Form {...wholesalerForm}>
                        <form onSubmit={wholesalerForm.handleSubmit(onWholesalerSignup)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={wholesalerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="John" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={wholesalerForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Doe" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={wholesalerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      {...field} 
                                      type="email" 
                                      placeholder="business@example.com"
                                      className="pl-10"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={wholesalerForm.control}
                            name="businessName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Your Business Name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={wholesalerForm.control}
                            name="businessAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Address</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Complete business address" className="min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={wholesalerForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Personal Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="+91 98765 43210" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={wholesalerForm.control}
                              name="businessPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="+91 11 2345 6789" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={wholesalerForm.control}
                            name="gstNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GST Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="GST Registration Number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={wholesalerForm.control}
                              name="yearsInBusiness"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Years in Business</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="1" 
                                      placeholder="5"
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={wholesalerForm.control}
                              name="averageOrderValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Avg. Order Value</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="₹50,000" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={wholesalerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      {...field} 
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Create a strong password"
                                      className="pl-10 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    >
                                      {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={wholesalerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      {...field} 
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Confirm your password"
                                      className="pl-10"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={wholesalerForm.control}
                            name="references"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business References (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="List any business references or existing partnerships"
                                    className="min-h-[60px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            disabled={wholesalerSignupMutation.isPending}
                          >
                            {wholesalerSignupMutation.isPending ? "Submitting Application..." : "Submit Application"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}
                </div>
              )}

              {authMode === "forgot" && (
                <Form {...forgotForm}>
                  <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
                    <FormField
                      control={forgotForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="your.email@example.com"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </form>
                </Form>
              )}

              <Separator />

              {/* Mode Switching */}
              <div className="text-center text-sm">
                {authMode === "signin" && (
                  <p>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setAuthMode("signup")}
                      className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                    >
                      Sign up here
                    </button>
                  </p>
                )}
                
                {(authMode === "signup" || authMode === "forgot") && (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => setAuthMode("signin")}
                      className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}