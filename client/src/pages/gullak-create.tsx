import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator, Target, Calendar, Home } from "lucide-react";
import { PageTransition } from "@/components/loading/page-transition";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const createGullakSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  metalType: z.enum(["gold", "silver"]),
  paymentAmount: z.string().min(1, "Payment amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Payment amount must be a valid positive number"
  ),
  paymentFrequency: z.enum(["daily", "weekly", "monthly"]),
  paymentDayOfWeek: z.number().min(0).max(6).optional(),
  paymentDayOfMonth: z.number().min(1).max(28).optional(),
  targetMetalWeight: z.string().min(1, "Target metal weight is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Target metal weight must be a valid positive number"
  ),
  metalPurity: z.enum(["24k", "22k", "18k", "silver"]),
  autoPayEnabled: z.boolean().default(true),
});

type CreateGullakForm = z.infer<typeof createGullakSchema>;

interface MetalRates {
  rate24k: string;
  rate22k: string;
  rate18k: string;
  silverRate: string;
  effectiveDate: string;
}

export default function CreateGullak() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<CreateGullakForm>({
    resolver: zodResolver(createGullakSchema),
    defaultValues: {
      name: "",
      metalType: "gold",
      paymentAmount: "",
      paymentFrequency: "daily",
      targetMetalWeight: "",
      metalPurity: "24k",
      autoPayEnabled: true,
    },
  });

  // Fetch current metal rates
  const { data: metalRates, isLoading: ratesLoading } = useQuery<MetalRates>({
    queryKey: ["/api/gullak/gold-rates"],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Create Gullak account mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGullakForm) => {
      if (!metalRates) throw new Error("Metal rates not loaded");
      
      let ratePerGram: number;
      if (data.metalType === "silver") {
        ratePerGram = parseFloat(metalRates.silverRate);
      } else {
        ratePerGram = parseFloat(metalRates[`rate${data.metalPurity}` as keyof MetalRates]);
      }
      
      const targetAmount = (parseFloat(data.targetMetalWeight) * ratePerGram).toString();
      
      return apiRequest("POST", "/api/gullak/accounts", {
        ...data,
        targetAmount,
        userId: (user as any)?.id,
      });
    },
    onSuccess: () => {
      const selectedMetal = form.getValues().metalType;
      toast({
        title: "Gullak Account Created",
        description: `Your ${selectedMetal} savings journey has begun!`,
      });
      setLocation("/gullak");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Gullak account",
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();
  
  // Update metalPurity default when metalType changes
  useEffect(() => {
    if (watchedValues.metalType === "silver") {
      form.setValue("metalPurity", "silver");
    } else if (watchedValues.metalType === "gold" && watchedValues.metalPurity === "silver") {
      form.setValue("metalPurity", "24k");
    }
  }, [watchedValues.metalType, form]);
  
  // Calculate target amount based on metal weight and type
  const calculateTargetAmount = () => {
    if (!metalRates || !watchedValues.targetMetalWeight) return "0";
    
    let ratePerGram: number;
    if (watchedValues.metalType === "silver") {
      ratePerGram = parseFloat(metalRates.silverRate);
    } else {
      ratePerGram = parseFloat(metalRates[`rate${watchedValues.metalPurity}` as keyof MetalRates]);
    }
    
    const targetAmount = parseFloat(watchedValues.targetMetalWeight) * ratePerGram;
    return targetAmount.toFixed(2);
  };

  // Calculate days to reach target
  const calculateDaysToTarget = () => {
    if (!watchedValues.paymentAmount || !watchedValues.targetMetalWeight || !metalRates) return 0;
    
    const targetAmount = parseFloat(calculateTargetAmount());
    const paymentAmount = parseFloat(watchedValues.paymentAmount);
    const frequency = watchedValues.paymentFrequency;
    
    if (paymentAmount <= 0) return 0;
    
    // Calculate based on frequency
    let paymentsNeeded: number;
    if (frequency === "daily") {
      paymentsNeeded = Math.ceil(targetAmount / paymentAmount);
      return paymentsNeeded; // Already in days
    } else if (frequency === "weekly") {
      paymentsNeeded = Math.ceil(targetAmount / paymentAmount);
      return paymentsNeeded * 7; // Convert weeks to days
    } else { // monthly
      paymentsNeeded = Math.ceil(targetAmount / paymentAmount);
      return paymentsNeeded * 30; // Convert months to days
    }
  };

  const onSubmit = (data: CreateGullakForm) => {
    createMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to create Gullak</h1>
          <Link href="/auth">
            <Button>Log In</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  if (ratesLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const targetAmount = calculateTargetAmount();
  const daysToTarget = calculateDaysToTarget();

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-navy hover:text-gold">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/gullak">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gullak
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Create New Gullak</h1>
            <p className="text-gray-600">Start your gold savings journey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Gullak Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Account Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., My First Gold Savings" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Metal Type */}
                    <FormField
                      control={form.control}
                      name="metalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metal Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select metal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Metal Purity */}
                    {watchedValues.metalType === "gold" && (
                      <FormField
                        control={form.control}
                        name="metalPurity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gold Purity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gold purity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="24k">24K Gold (₹{metalRates?.rate24k}/g)</SelectItem>
                                <SelectItem value="22k">22K Gold (₹{metalRates?.rate22k}/g)</SelectItem>
                                <SelectItem value="18k">18K Gold (₹{metalRates?.rate18k}/g)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchedValues.metalType === "silver" && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Silver Rate: ₹{metalRates?.silverRate}/g
                        </p>
                      </div>
                    )}

                    {/* Target Metal Weight */}
                    <FormField
                      control={form.control}
                      name="targetMetalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target {watchedValues.metalType === "silver" ? "Silver" : "Gold"} Weight (grams)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="e.g., 10" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Daily Amount */}
                    <FormField
                      control={form.control}
                      name="dailyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Auto-pay Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1" 
                              placeholder="e.g., 100" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-gold hover:bg-gold/90"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Gullak Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Summary */}
          <div className="space-y-6">
            {/* Current Gold Rates */}
            <Card className="border-gold/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gold">Today's Metal Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>24K Gold</span>
                  <span className="font-semibold">₹{metalRates?.rate24k}/g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>22K Gold</span>
                  <span className="font-semibold">₹{metalRates?.rate22k}/g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>18K Gold</span>
                  <span className="font-semibold">₹{metalRates?.rate18k}/g</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span>Silver</span>
                  <span className="font-semibold">₹{metalRates?.silverRate}/g</span>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Calculator className="h-4 w-4" />
                  Calculation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target {watchedValues.metalType === "silver" ? "Silver" : "Gold"}</span>
                    <span className="font-semibold">
                      {watchedValues.targetMetalWeight || "0"}g {watchedValues.metalType === "gold" ? watchedValues.metalPurity : "Silver"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target Amount</span>
                    <span className="font-semibold text-gold">₹{targetAmount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Savings</span>
                    <span className="font-semibold">₹{watchedValues.dailyAmount || "0"}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Days to Target
                    </span>
                    <span className="font-semibold text-navy">
                      {daysToTarget > 0 ? `${daysToTarget} days` : "-"}
                    </span>
                  </div>
                  
                  {daysToTarget > 0 && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                      Expected completion: {new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-amber-800">Important Notes:</div>
                  <ul className="text-amber-700 space-y-1 text-xs">
                    <li>• Auto-pay will be deducted daily</li>
                    <li>• Gold rates may fluctuate</li>
                    <li>• You can pause/resume anytime</li>
                    <li>• Order gold coin when target is reached</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}