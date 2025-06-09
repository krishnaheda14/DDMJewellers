import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Heart, Calendar, MapPin, Users, Crown, Palette, Zap, Star, Gift, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageNavigation from "@/components/page-navigation";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface RecommendationRequest {
  occasion: string;
  budget: number[];
  style: string;
  metalPreference: string;
  gemstonePreference: string;
  ageGroup: string;
  relationship: string;
  seasonalPreference: string;
  additionalDetails?: string;
}

interface ShingaarRecommendation {
  recommendations: Product[];
  occasionTips: string[];
  stylingAdvice: string;
  culturalSignificance: string;
  confidenceScore: number;
}

const occasions = [
  { value: "wedding", label: "Wedding", icon: "💒", description: "Bridal & groom jewelry" },
  { value: "engagement", label: "Engagement", icon: "💍", description: "Romantic proposals" },
  { value: "festival", label: "Festival", icon: "🎊", description: "Traditional celebrations" },
  { value: "party", label: "Party", icon: "🎉", description: "Social gatherings" },
  { value: "office", label: "Office", icon: "💼", description: "Professional wear" },
  { value: "anniversary", label: "Anniversary", icon: "❤️", description: "Special milestones" },
  { value: "birthday", label: "Birthday", icon: "🎂", description: "Birthday celebrations" },
  { value: "religious", label: "Religious", icon: "🙏", description: "Spiritual ceremonies" },
  { value: "casual", label: "Casual", icon: "👕", description: "Everyday wear" },
  { value: "date", label: "Date Night", icon: "🌹", description: "Romantic evenings" }
];

const styles = [
  { value: "traditional", label: "Traditional", description: "Classic Indian designs" },
  { value: "contemporary", label: "Contemporary", description: "Modern fusion styles" },
  { value: "minimalist", label: "Minimalist", description: "Simple & elegant" },
  { value: "statement", label: "Statement", description: "Bold & eye-catching" },
  { value: "vintage", label: "Vintage", description: "Retro & antique styles" },
  { value: "bohemian", label: "Bohemian", description: "Free-spirited designs" }
];

const metals = [
  { value: "gold", label: "Gold", description: "Yellow, white, or rose gold" },
  { value: "silver", label: "Silver", description: "Sterling silver pieces" },
  { value: "platinum", label: "Platinum", description: "Premium white metal" },
  { value: "mixed", label: "Mixed Metals", description: "Combination designs" }
];

const gemstones = [
  { value: "diamond", label: "Diamond", description: "Classic brilliance" },
  { value: "ruby", label: "Ruby", description: "Passionate red stones" },
  { value: "emerald", label: "Emerald", description: "Lush green gems" },
  { value: "sapphire", label: "Sapphire", description: "Royal blue stones" },
  { value: "pearl", label: "Pearl", description: "Elegant natural gems" },
  { value: "mixed", label: "Mixed Gems", description: "Colorful combinations" },
  { value: "none", label: "No Preference", description: "Any or no gemstones" }
];

export default function ShingaarGuru() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'questionnaire' | 'recommendations'>('questionnaire');
  const [formData, setFormData] = useState<RecommendationRequest>({
    occasion: '',
    budget: [10000, 100000],
    style: '',
    metalPreference: '',
    gemstonePreference: '',
    ageGroup: '',
    relationship: '',
    seasonalPreference: '',
    additionalDetails: ''
  });
  const [recommendations, setRecommendations] = useState<ShingaarRecommendation | null>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const recommendationMutation = useMutation({
    mutationFn: async (request: RecommendationRequest): Promise<ShingaarRecommendation> => {
      const response = await fetch("/api/shingaar-guru/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate recommendations');
      }
      
      return response.json();
    },
    onSuccess: (data: ShingaarRecommendation) => {
      setRecommendations(data);
      setStep('recommendations');
      toast({
        title: "Recommendations Ready!",
        description: "Shingaar Guru has curated perfect jewelry suggestions for you.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to get personalized recommendations.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1500);
        return;
      }
      toast({
        title: "Recommendation Failed",
        description: "Unable to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.occasion || !formData.style || !formData.metalPreference) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields to get recommendations.",
        variant: "destructive",
      });
      return;
    }
    recommendationMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Sparkles className="h-16 w-16 text-gold mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Shingaar Guru</h1>
            <p className="text-muted-foreground mb-6">
              Get personalized jewelry recommendations for every occasion. Please log in to access this feature.
            </p>
            <Button onClick={() => window.location.href = "/auth"} className="bg-gold hover:bg-gold/90">
              Sign In to Continue
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageNavigation />
      
      <div className="container mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Sparkles className="h-10 w-10 text-gold" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold to-amber-600 bg-clip-text text-transparent">
              Shingaar Guru
            </h1>
            <Crown className="h-10 w-10 text-gold" />
          </motion.div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal jewelry stylist for every occasion. Get AI-powered recommendations 
            tailored to your style, budget, and cultural preferences.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'questionnaire' && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="border-gold/20 shadow-lg">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Gift className="h-6 w-6 text-gold" />
                    Tell Us About Your Occasion
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Help us understand your needs to provide the perfect recommendations
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Occasion Selection */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gold" />
                      What's the occasion? *
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {occasions.map((occasion) => (
                        <Card
                          key={occasion.value}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            formData.occasion === occasion.value
                              ? 'ring-2 ring-gold border-gold bg-gold/5'
                              : 'hover:border-gold/30'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, occasion: occasion.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{occasion.icon}</div>
                            <div className="font-medium text-sm">{occasion.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{occasion.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Star className="h-5 w-5 text-gold" />
                      Budget Range
                    </Label>
                    <div className="px-4">
                      <Slider
                        value={formData.budget}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                        max={500000}
                        min={5000}
                        step={5000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>{formatCurrency(formData.budget[0])}</span>
                        <span>{formatCurrency(formData.budget[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Style Preference */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-gold" />
                      Style Preference *
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {styles.map((style) => (
                        <Card
                          key={style.value}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            formData.style === style.value
                              ? 'ring-2 ring-gold border-gold bg-gold/5'
                              : 'hover:border-gold/30'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, style: style.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Metal & Gemstone Preferences */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Metal Preference *</Label>
                      <Select
                        value={formData.metalPreference}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, metalPreference: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred metal" />
                        </SelectTrigger>
                        <SelectContent>
                          {metals.map((metal) => (
                            <SelectItem key={metal.value} value={metal.value}>
                              <div>
                                <div className="font-medium">{metal.label}</div>
                                <div className="text-xs text-muted-foreground">{metal.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Gemstone Preference</Label>
                      <Select
                        value={formData.gemstonePreference}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gemstonePreference: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gemstone preference" />
                        </SelectTrigger>
                        <SelectContent>
                          {gemstones.map((gemstone) => (
                            <SelectItem key={gemstone.value} value={gemstone.value}>
                              <div>
                                <div className="font-medium">{gemstone.label}</div>
                                <div className="text-xs text-muted-foreground">{gemstone.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Age Group</Label>
                      <Select
                        value={formData.ageGroup}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroup: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teen">Teen (13-19)</SelectItem>
                          <SelectItem value="young-adult">Young Adult (20-30)</SelectItem>
                          <SelectItem value="adult">Adult (31-50)</SelectItem>
                          <SelectItem value="mature">Mature (50+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="For whom?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">For Myself</SelectItem>
                          <SelectItem value="spouse">Spouse/Partner</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Season</Label>
                      <Select
                        value={formData.seasonalPreference}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, seasonalPreference: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Current season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spring">Spring</SelectItem>
                          <SelectItem value="summer">Summer</SelectItem>
                          <SelectItem value="monsoon">Monsoon</SelectItem>
                          <SelectItem value="autumn">Autumn</SelectItem>
                          <SelectItem value="winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Additional Details (Optional)</Label>
                    <Textarea
                      placeholder="Any specific requirements, cultural preferences, or special considerations..."
                      value={formData.additionalDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                      className="min-h-24"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={recommendationMutation.isPending}
                      className="bg-gold hover:bg-gold/90 text-white px-8 py-3 text-lg"
                    >
                      {recommendationMutation.isPending ? (
                        <>
                          <Zap className="mr-2 h-5 w-5 animate-spin" />
                          Generating Recommendations...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Get My Recommendations
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'recommendations' && recommendations && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => setStep('questionnaire')}
                className="mb-6"
              >
                ← Modify Preferences
              </Button>

              {/* Recommendations Header */}
              <Card className="border-gold/20 shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Crown className="h-6 w-6 text-gold" />
                    Your Personalized Recommendations
                  </CardTitle>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-gold/10 text-gold">
                      Confidence: {Math.round(recommendations.confidenceScore * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Styling Advice */}
                  <div className="bg-gold/5 p-6 rounded-lg border border-gold/20">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-gold" />
                      Styling Advice
                    </h3>
                    <p className="text-muted-foreground">{recommendations.stylingAdvice}</p>
                  </div>

                  {/* Cultural Significance */}
                  {recommendations.culturalSignificance && (
                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-amber-600" />
                        Cultural Significance
                      </h3>
                      <p className="text-amber-800">{recommendations.culturalSignificance}</p>
                    </div>
                  )}

                  {/* Occasion Tips */}
                  {recommendations.occasionTips.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        Occasion Tips
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.occasionTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-blue-800">
                            <span className="text-blue-600 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommended Products */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Recommended Jewelry</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.recommendations.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="transform hover:scale-105 transition-transform"
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}