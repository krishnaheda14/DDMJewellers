import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gem, Settings, Type, Ruler } from "lucide-react";
import type { Product } from "@shared/schema";

interface JewelryCustomizerProps {
  product: Product;
  onCustomizationChange: (customizations: any, additionalPrice: number) => void;
}

interface Customizations {
  metal?: string;
  gemstone?: string;
  size?: string;
  engraving?: string;
  font?: string;
}

export default function JewelryCustomizer({ product, onCustomizationChange }: JewelryCustomizerProps) {
  const [customizations, setCustomizations] = useState<Customizations>({});
  const [additionalPrice, setAdditionalPrice] = useState(0);

  // Check if product is customizable
  if (!product.customizable || !product.customizationOptions) {
    return null;
  }

  const options = product.customizationOptions;
  const priceAdjustments = options.priceAdjustments || {};

  const updateCustomization = (key: keyof Customizations, value: string) => {
    const newCustomizations = { ...customizations, [key]: value };
    setCustomizations(newCustomizations);

    // Calculate additional price
    let newAdditionalPrice = 0;
    Object.entries(newCustomizations).forEach(([optionKey, optionValue]) => {
      if (optionValue && priceAdjustments[`${optionKey}_${optionValue}`]) {
        newAdditionalPrice += priceAdjustments[`${optionKey}_${optionValue}`];
      }
    });

    setAdditionalPrice(newAdditionalPrice);
    onCustomizationChange(newCustomizations, newAdditionalPrice);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-amber-600" />
          Customize Your Jewelry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metal Selection */}
        {options.metals && options.metals.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Gem className="h-4 w-4" />
              Metal Type
            </Label>
            <Select value={customizations.metal || ""} onValueChange={(value) => updateCustomization('metal', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select metal type" />
              </SelectTrigger>
              <SelectContent>
                {options.metals.map((metal) => (
                  <SelectItem key={metal} value={metal}>
                    <div className="flex items-center justify-between w-full">
                      <span>{metal}</span>
                      {priceAdjustments[`metal_${metal}`] && (
                        <Badge variant="secondary" className="ml-2">
                          +₹{priceAdjustments[`metal_${metal}`]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Gemstone Selection */}
        {options.gemstones && options.gemstones.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Gem className="h-4 w-4" />
              Gemstone
            </Label>
            <Select value={customizations.gemstone || ""} onValueChange={(value) => updateCustomization('gemstone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gemstone" />
              </SelectTrigger>
              <SelectContent>
                {options.gemstones.map((gemstone) => (
                  <SelectItem key={gemstone} value={gemstone}>
                    <div className="flex items-center justify-between w-full">
                      <span>{gemstone}</span>
                      {priceAdjustments[`gemstone_${gemstone}`] && (
                        <Badge variant="secondary" className="ml-2">
                          +₹{priceAdjustments[`gemstone_${gemstone}`]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Size Selection */}
        {options.sizes && options.sizes.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Size
            </Label>
            <Select value={customizations.size || ""} onValueChange={(value) => updateCustomization('size', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {options.sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    <div className="flex items-center justify-between w-full">
                      <span>{size}</span>
                      {priceAdjustments[`size_${size}`] && (
                        <Badge variant="secondary" className="ml-2">
                          +₹{priceAdjustments[`size_${size}`]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Engraving Options */}
        {options.engravingOptions && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              Engraving (Optional)
            </Label>
            <Input
              placeholder={`Enter text (max ${options.engravingOptions.maxLength} characters)`}
              value={customizations.engraving || ""}
              onChange={(e) => {
                const value = e.target.value.slice(0, options.engravingOptions?.maxLength || 20);
                updateCustomization('engraving', value);
              }}
              maxLength={options.engravingOptions.maxLength}
            />
            {customizations.engraving && options.engravingOptions.fonts && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Style</Label>
                <Select value={customizations.font || ""} onValueChange={(value) => updateCustomization('font', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.engravingOptions.fonts.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font.toLowerCase() }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {priceAdjustments.engraving && customizations.engraving && (
              <Badge variant="secondary">
                Engraving: +₹{priceAdjustments.engraving}
              </Badge>
            )}
          </div>
        )}

        {/* Price Summary */}
        {additionalPrice > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <span className="font-medium text-gray-700">Customization Cost:</span>
              <span className="font-bold text-amber-600">+₹{additionalPrice}</span>
            </div>
          </>
        )}

        {/* Customization Summary */}
        {Object.keys(customizations).some(key => customizations[key as keyof Customizations]) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Customizations:</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(customizations).map(([key, value]) => {
                if (!value) return null;
                return (
                  <Badge key={key} variant="outline">
                    {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}