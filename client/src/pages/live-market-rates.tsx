import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, RefreshCw, Calculator, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MarketRates {
  id: number;
  rate24k: string;
  rate22k: string;
  rate18k: string;
  silverRate: string;
  currency: string;
  source: string;
  effectiveDate: string;
  createdAt: string;
}

interface PriceCalculation {
  price: number;
  weight: number;
  purity: string;
  markup: number;
}

export default function LiveMarketRates() {
  const { toast } = useToast();
  const [weight, setWeight] = useState("10");
  const [purity, setPurity] = useState("24k");
  const [markup, setMarkup] = useState("1.3");
  const [calculatedPrice, setCalculatedPrice] = useState<PriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch current market rates with auto-refresh
  const { data: rates, isLoading, refetch } = useQuery<MarketRates>({
    queryKey: ["/api/market-rates"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchIntervalInBackground: true,
  });

  const calculatePrice = async () => {
    if (!weight || !purity) {
      toast({
        title: "Input Required",
        description: "Please enter weight and select purity",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const result = await apiRequest("POST", "/api/market-rates/calculate-price", {
        weight: parseFloat(weight),
        purity,
        markup: parseFloat(markup),
      });
      
      setCalculatedPrice(result as PriceCalculation);
      toast({
        title: "Price Calculated",
        description: `Estimated price: $${result.price}`,
      });
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading live market rates...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent mb-2">
            Live Market Rates
          </h1>
          <p className="text-muted-foreground">
            Real-time precious metal prices updated every 5 minutes
          </p>
        </div>

        {/* Current Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Gold 24K */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                Gold 24K
              </CardTitle>
              <CardDescription>Per ounce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {rates ? formatPrice(rates.rate24k) : '--'}
              </div>
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardContent>
          </Card>

          {/* Gold 22K */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                Gold 22K
              </CardTitle>
              <CardDescription>Per ounce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {rates ? formatPrice(rates.rate22k) : '--'}
              </div>
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardContent>
          </Card>

          {/* Gold 18K */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-300"></div>
                Gold 18K
              </CardTitle>
              <CardDescription>Per ounce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {rates ? formatPrice(rates.rate18k) : '--'}
              </div>
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardContent>
          </Card>

          {/* Silver */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                Silver
              </CardTitle>
              <CardDescription>Per ounce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {rates ? formatPrice(rates.silverRate) : '--'}
              </div>
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Market Info */}
        {rates && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Market Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </Label>
                  <p className="text-sm font-mono">
                    {formatDate(rates.effectiveDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Data Source
                  </Label>
                  <p className="text-sm">
                    {rates.source}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Currency
                  </Label>
                  <p className="text-sm">
                    {rates.currency}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="outline">
                  Auto-updates every 5 minutes
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Jewelry Price Calculator
            </CardTitle>
            <CardDescription>
              Calculate estimated jewelry prices based on current market rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight in grams"
                />
              </div>
              <div>
                <Label htmlFor="purity">Gold Purity</Label>
                <Select value={purity} onValueChange={setPurity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24k">24K Gold</SelectItem>
                    <SelectItem value="22k">22K Gold</SelectItem>
                    <SelectItem value="18k">18K Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="markup">Markup Factor</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.1"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  placeholder="Enter markup (e.g., 1.3)"
                />
              </div>
            </div>

            <Button
              onClick={calculatePrice}
              disabled={isCalculating}
              className="w-full md:w-auto gap-2"
            >
              {isCalculating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Calculate Price
            </Button>

            {calculatedPrice && (
              <>
                <Separator className="my-6" />
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Calculation Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Estimated Price
                      </Label>
                      <p className="text-3xl font-bold text-primary">
                        ${calculatedPrice.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Weight:</span>
                        <span className="text-sm font-medium">{calculatedPrice.weight}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Purity:</span>
                        <span className="text-sm font-medium">{calculatedPrice.purity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Markup:</span>
                        <span className="text-sm font-medium">{calculatedPrice.markup}x</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    * This is an estimated price based on current market rates and may vary based on design complexity, craftsmanship, and other factors.
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}