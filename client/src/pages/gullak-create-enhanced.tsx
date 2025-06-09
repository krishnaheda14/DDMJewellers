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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calculator, Target, Calendar, Clock, Coins } from "lucide-react";
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
}

export default function CreateGullakEnhanced() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const watchedValues = form.watch();

  // Fetch current metal rates
  const { data: metalRates, isLoading: ratesLoading } = useQuery<MetalRates>({
    queryKey: ["/api/gullak/gold-rates"],
  });

  // Create Gullak mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGullakForm) => {
      // Calculate next payment date
      const now = new Date();
      let nextPaymentDate = new Date(now);
      
      if (data.paymentFrequency === "weekly") {
        const targetDay = data.paymentDayOfWeek || 1;
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        nextPaymentDate.setDate(now.getDate() + daysUntilTarget);
      } else if (data.paymentFrequency === "monthly") {
        const targetDate = data.paymentDayOfMonth || 1;
        nextPaymentDate.setMonth(now.getMonth() + 1);
        nextPaymentDate.setDate(Math.min(targetDate, new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate()));
      } else {
        nextPaymentDate.setDate(now.getDate() + 1);
      }

      const payload = {
        ...data,
        userId: user?.id,
        currentBalance: "0",
        status: "active",
        nextPaymentDate: nextPaymentDate.toISOString(),
        paymentDayOfWeek: data.paymentDayOfWeek,
        paymentDayOfMonth: data.paymentDayOfMonth,
      };

      return await apiRequest("POST", "/api/gullak", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gullak account created successfully with autopay enabled!",
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

  // Calculate target amount
  const calculateTargetAmount = () => {
    if (!watchedValues.targetMetalWeight || !metalRates) return "0";
    
    let ratePerGram: number;
    if (watchedValues.metalType === "silver") {
      ratePerGram = parseFloat(metalRates.silverRate || "85");
    } else {
      const rateKey = `rate${watchedValues.metalPurity}` as keyof MetalRates;
      ratePerGram = parseFloat(metalRates[rateKey] || metalRates.rate24k);
    }
    
    const targetAmount = parseFloat(watchedValues.targetMetalWeight) * ratePerGram;
    return targetAmount.toFixed(2);
  };

  // Calculate time to reach target
  const calculateTimeToTarget = () => {
    if (!watchedValues.paymentAmount || !watchedValues.targetMetalWeight || !metalRates) return { days: 0, payments: 0 };
    
    const targetAmount = parseFloat(calculateTargetAmount());
    const paymentAmount = parseFloat(watchedValues.paymentAmount);
    const frequency = watchedValues.paymentFrequency;
    
    if (paymentAmount <= 0) return { days: 0, payments: 0 };
    
    const paymentsNeeded = Math.ceil(targetAmount / paymentAmount);
    let days: number;
    
    if (frequency === "daily") {
      days = paymentsNeeded;
    } else if (frequency === "weekly") {
      days = paymentsNeeded * 7;
    } else { // monthly
      days = paymentsNeeded * 30;
    }
    
    return { days, payments: paymentsNeeded };
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const timeCalculation = calculateTimeToTarget();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/gullak">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gullak
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Gullak Account</h1>
              <p className="text-gray-600 dark:text-gray-300">Start your journey towards gold/silver investment with automated payments</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  Account Details
                </CardTitle>
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
                            <Input placeholder="Enter account name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Metal Type & Purity */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="metalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metal Type</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select metal" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gold">Gold</SelectItem>
                                  <SelectItem value="silver">Silver</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metalPurity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purity</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select purity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {watchedValues.metalType === "gold" ? (
                                    <>
                                      <SelectItem value="24k">24K Gold</SelectItem>
                                      <SelectItem value="22k">22K Gold</SelectItem>
                                      <SelectItem value="18k">18K Gold</SelectItem>
                                    </>
                                  ) : (
                                    <SelectItem value="silver">Pure Silver</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Target Weight */}
                    <FormField
                      control={form.control}
                      name="targetMetalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Weight (grams)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter target weight"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Payment Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Payment Configuration
                      </h3>

                      <FormField
                        control={form.control}
                        name="paymentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter payment amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Frequency</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Day Selection for Weekly */}
                      {watchedValues.paymentFrequency === "weekly" && (
                        <FormField
                          control={form.control}
                          name="paymentDayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day of Week</FormLabel>
                              <FormControl>
                                <Select 
                                  value={field.value?.toString()} 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Monday</SelectItem>
                                    <SelectItem value="2">Tuesday</SelectItem>
                                    <SelectItem value="3">Wednesday</SelectItem>
                                    <SelectItem value="4">Thursday</SelectItem>
                                    <SelectItem value="5">Friday</SelectItem>
                                    <SelectItem value="6">Saturday</SelectItem>
                                    <SelectItem value="0">Sunday</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Date Selection for Monthly */}
                      {watchedValues.paymentFrequency === "monthly" && (
                        <FormField
                          control={form.control}
                          name="paymentDayOfMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day of Month (1-28)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="28"
                                  placeholder="Enter day"
                                  value={field.value?.toString() || ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Auto Pay Toggle */}
                      <FormField
                        control={form.control}
                        name="autoPayEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Auto Pay</FormLabel>
                              <div className="text-sm text-gray-600">
                                Automatically process payments based on selected frequency
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating Account..." : "Create Gullak Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Calculation Preview */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Investment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {metalRates && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current Rate</div>
                      <div className="text-lg font-bold text-amber-600">
                        ₹{watchedValues.metalType === "silver" 
                          ? metalRates.silverRate 
                          : metalRates[`rate${watchedValues.metalPurity}` as keyof MetalRates]}/g
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Target Amount</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{calculateTargetAmount()}
                      </div>
                    </div>
                  </div>
                )}

                {watchedValues.paymentAmount && watchedValues.targetMetalWeight && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded">
                      <span className="text-sm font-medium">Payment Frequency:</span>
                      <span className="capitalize font-bold text-blue-600">
                        {watchedValues.paymentFrequency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-gray-800 rounded">
                      <span className="text-sm font-medium">Payments Needed:</span>
                      <span className="font-bold text-green-600">
                        {timeCalculation.payments} payments
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-800 rounded">
                      <span className="text-sm font-medium">Time to Target:</span>
                      <span className="font-bold text-purple-600">
                        ~{Math.ceil(timeCalculation.days / 30)} months
                      </span>
                    </div>

                    {watchedValues.paymentFrequency === "weekly" && watchedValues.paymentDayOfWeek && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium">Payment Day:</span>
                        <span className="font-bold text-orange-600">
                          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][watchedValues.paymentDayOfWeek]}
                        </span>
                      </div>
                    )}

                    {watchedValues.paymentFrequency === "monthly" && watchedValues.paymentDayOfMonth && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium">Payment Date:</span>
                        <span className="font-bold text-red-600">
                          {watchedValues.paymentDayOfMonth}{watchedValues.paymentDayOfMonth === 1 ? "st" : watchedValues.paymentDayOfMonth === 2 ? "nd" : watchedValues.paymentDayOfMonth === 3 ? "rd" : "th"} of each month
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">Benefits</span>
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Automated {watchedValues.paymentFrequency} investments</li>
                    <li>• No manual payment hassles</li>
                    <li>• Transparent gold/silver accumulation</li>
                    <li>• Real-time progress tracking</li>
                    <li>• Flexible payment schedule</li>
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