import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PricingBreakdown {
  weightInGrams: number;
  ratePerGram: number;
  metalCost: number;
  makingCharges: number;
  gemstonesCost: number;
  diamondsCost: number;
  subtotal: number;
  gstAmount: number;
  finalPrice: number;
}

interface PricingBreakdownProps {
  productId?: number;
  productType: "real" | "imitation";
  material?: string;
  weight?: number;
  makingCharges?: number;
  gemstonesCost?: number;
  diamondsCost?: number;
  silverBillingMode?: "live_rate" | "fixed_rate";
  fixedRatePerGram?: number;
  quantity?: number;
  showRefresh?: boolean;
}

export function PricingBreakdownComponent({ 
  productId,
  productType,
  material = "",
  weight = 0,
  makingCharges = 0,
  gemstonesCost = 0,
  diamondsCost = 0,
  silverBillingMode = "live_rate",
  fixedRatePerGram = 0,
  quantity = 1,
  showRefresh = true
}: PricingBreakdownProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Query for live pricing calculation
  const { data: pricingData, isLoading, refetch } = useQuery({
    queryKey: [`/api/calculate-pricing`, refreshKey, {
      productType,
      material,
      weight,
      makingCharges,
      gemstonesCost,
      diamondsCost,
      silverBillingMode,
      fixedRatePerGram,
      quantity
    }],
    enabled: productType === "real" && weight > 0 && material !== "",
    queryFn: async () => {
      const response = await fetch("/api/calculate-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          material,
          weight,
          makingCharges,
          gemstonesCost,
          diamondsCost,
          silverBillingMode,
          fixedRatePerGram,
          quantity
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to calculate pricing");
      }
      
      return response.json();
    }
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (productType === "imitation") {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Pricing Information</CardTitle>
          <Badge variant="secondary">Imitation Jewelry</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This imitation jewelry item has a fixed price. No weight-based calculation applies.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!weight || !material) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Pricing Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Weight and material information required for live pricing calculation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle className="text-lg font-semibold">Live Pricing Breakdown</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live Rates
          </Badge>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Calculating live pricing...</span>
          </div>
        ) : pricingData ? (
          <>
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material</p>
                <p className="text-base font-semibold">{material}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                <p className="text-base font-semibold">{weight}g</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rate per Gram</p>
                <p className="text-base font-semibold text-green-600">
                  ₹{pricingData.breakdown.ratePerGram.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Billing Mode</p>
                <p className="text-base font-semibold">
                  {silverBillingMode === "live_rate" ? "Live Rate" : "Fixed Rate"}
                </p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-base">Cost Breakdown</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Metal Cost ({weight}g × ₹{pricingData.breakdown.ratePerGram.toFixed(2)})</span>
                  <span className="font-medium">₹{pricingData.breakdown.metalCost.toFixed(2)}</span>
                </div>
                
                {pricingData.breakdown.makingCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Making Charges</span>
                    <span className="font-medium">₹{pricingData.breakdown.makingCharges.toFixed(2)}</span>
                  </div>
                )}
                
                {pricingData.breakdown.gemstonesCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gemstones Cost</span>
                    <span className="font-medium">₹{pricingData.breakdown.gemstonesCost.toFixed(2)}</span>
                  </div>
                )}
                
                {pricingData.breakdown.diamondsCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Diamonds Cost</span>
                    <span className="font-medium">₹{pricingData.breakdown.diamondsCost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal</span>
                <span>₹{pricingData.breakdown.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">GST (3%)</span>
                <span>₹{pricingData.breakdown.gstAmount.toFixed(2)}</span>
              </div>

              <Separator />
              
              {quantity > 1 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{quantity} pieces</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-lg font-bold text-primary">
                <span>Final Price</span>
                <span>₹{pricingData.breakdown.finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last updated: {new Date(pricingData.timestamp).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to calculate pricing. Please try again.</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Retry Calculation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}