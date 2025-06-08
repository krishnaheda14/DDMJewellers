import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Gift, Wrench, Star, CheckCircle } from "lucide-react";
import { insertCorporateRegistrationSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertCorporateRegistrationSchema.extend({
  purposeOfTieup: z.array(z.string()).min(1, "Please select at least one purpose"),
});

type FormData = z.infer<typeof formSchema>;

export default function CorporateRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      gstin: "",
      companyAddress: "",
      contactPersonName: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
      companyEmail: "",
      approximateEmployees: 0,
      purposeOfTieup: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const submitData = {
        ...data,
        purposeOfTieup: JSON.stringify(data.purposeOfTieup),
      };
      return await apiRequest("POST", "/api/corporate/register", submitData);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Submitted",
        description: "Your corporate registration has been submitted successfully. We'll review it within 2-3 business days.",
      });
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "There was an error submitting your registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const purposeOptions = [
    { id: "bulk_gifting", label: "Bulk Gifting", icon: Gift },
    { id: "employee_offers", label: "Employee Offers & Discounts", icon: Star },
    { id: "maintenance_service", label: "Free Maintenance Service", icon: Wrench },
    { id: "all", label: "All of the Above", icon: CheckCircle },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                Registration Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-lg">
                Thank you for your interest in partnering with DDM Jewellers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Your corporate tie-up application has been received and is being reviewed by our team.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Our team will review your application within 2-3 business days</li>
                  <li>• You'll receive an email notification about the approval status</li>
                  <li>• Once approved, you'll get access to your Corporate Portal</li>
                  <li>• Your unique Corporate Code will be shared for employee benefits</li>
                </ul>
              </div>
              <Button onClick={() => window.location.href = "/"} className="w-full">
                Return to Home
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Corporate Gifting & Employee Privileges Program
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Partner with us to offer exclusive jewelry privileges to your employees. From bulk gifting to personal discounts and free maintenance, reward your team with the timeless gift of jewelry!
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Bulk Corporate Gifting</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Employee Discounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-amber-600" />
              <span className="text-gray-700 dark:text-gray-300">Free Maintenance</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Corporate Registration Form
            </CardTitle>
            <CardDescription>
              Fill out this form to start your corporate partnership with DDM Jewellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Registration Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter registration number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GSTIN number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter complete company address"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approximateEmployees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approximate Number of Employees *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter number of employees"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPersonEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter contact email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter company email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Purpose of Tie-up */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purpose of Partnership</h3>
                  
                  <FormField
                    control={form.control}
                    name="purposeOfTieup"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select all that apply *</FormLabel>
                        <div className="grid md:grid-cols-2 gap-4">
                          {purposeOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="purposeOfTieup"
                              render={({ field }) => {
                                const Icon = option.icon;
                                return (
                                  <FormItem
                                    key={option.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, option.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== option.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-amber-600" />
                                        <FormLabel className="text-sm font-medium">
                                          {option.label}
                                        </FormLabel>
                                      </div>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Benefits Overview */}
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">
                    Benefits Your Employees Will Receive
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Special Discounts
                      </Badge>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Exclusive discounts on personal jewelry purchases
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Free Maintenance
                      </Badge>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Annual free cleaning, polishing, and minor repairs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Priority Service
                      </Badge>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Fast-track service and dedicated support
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}