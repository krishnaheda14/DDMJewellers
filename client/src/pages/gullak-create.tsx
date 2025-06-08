import { useState } from "react";
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
import { ArrowLeft, Calculator, Target, Calendar } from "lucide-react";
import { PageTransition } from "@/components/loading/page-transition";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const createGullakSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  dailyAmount: z.string().min(1, "Daily amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Daily amount must be a valid positive number"
  ),
  targetGoldWeight: z.string().min(1, "Target gold weight is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Target gold weight must be a valid positive number"
  ),
  goldPurity: z.enum(["24k", "22k", "18k"]),
});

type CreateGullakForm = z.infer<typeof createGullakSchema>;

interface GoldRate {
  rate24k: string;
  rate22k: string;
  rate18k: string;
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
      dailyAmount: "",
      targetGoldWeight: "",
      goldPurity: "24k",
    },
  });

  // Fetch current gold rates
  const { data: goldRates, isLoading: ratesLoading } = useQuery<GoldRate>({
    queryKey: ["/api/gullak/gold-rates"],
    enabled: isAuthenticated,
  });

  // Create Gullak account mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGullakForm) => {
      const goldRate = goldRates?.[`rate${data.goldPurity}` as keyof GoldRate] || "0";
      const targetAmount = (parseFloat(data.targetGoldWeight) * parseFloat(goldRate)).toString();
      
      return apiRequest("POST", "/api/gullak/accounts", {
        ...data,
        targetAmount,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Gullak Account Created",
        description: "Your gold savings journey has begun!",
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
  
  // Calculate target amount based on gold weight and purity
  const calculateTargetAmount = () => {
    if (!goldRates || !watchedValues.targetGoldWeight || !watchedValues.goldPurity) return "0";
    
    const goldRate = goldRates[`rate${watchedValues.goldPurity}` as keyof GoldRate];
    const targetAmount = parseFloat(watchedValues.targetGoldWeight) * parseFloat(goldRate);
    return targetAmount.toFixed(2);
  };

  // Calculate days to reach target
  const calculateDaysToTarget = () => {
    if (!watchedValues.dailyAmount || !watchedValues.targetGoldWeight || !goldRates) return 0;
    
    const targetAmount = parseFloat(calculateTargetAmount());
    const dailyAmount = parseFloat(watchedValues.dailyAmount);
    
    if (dailyAmount <= 0) return 0;
    
    return Math.ceil(targetAmount / dailyAmount);
  };

  const onSubmit = (data: CreateGullakForm) => {
    createMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to create Gullak</h1>
          <Link href="/api/login">
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
          <Link href="/gullak">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gullak
            </Button>
          </Link>
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

                    {/* Gold Purity */}
                    <FormField
                      control={form.control}
                      name="goldPurity"
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
                              <SelectItem value="24k">24K Gold (₹{goldRates?.rate24k}/g)</SelectItem>
                              <SelectItem value="22k">22K Gold (₹{goldRates?.rate22k}/g)</SelectItem>
                              <SelectItem value="18k">18K Gold (₹{goldRates?.rate18k}/g)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Gold Weight */}
                    <FormField
                      control={form.control}
                      name="targetGoldWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Gold Weight (grams)</FormLabel>
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
                <CardTitle className="text-sm font-medium text-gold">Today's Gold Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>24K Gold</span>
                  <span className="font-semibold">₹{goldRates?.rate24k}/g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>22K Gold</span>
                  <span className="font-semibold">₹{goldRates?.rate22k}/g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>18K Gold</span>
                  <span className="font-semibold">₹{goldRates?.rate18k}/g</span>
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
                    <span className="text-sm text-gray-600">Target Gold</span>
                    <span className="font-semibold">
                      {watchedValues.targetGoldWeight || "0"}g {watchedValues.goldPurity}
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