import { marketRatesService } from "./market-rates";

export interface PricingBreakdown {
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

export interface ProductPricingData {
  productType: "real" | "imitation";
  material: string;
  weight: number;
  makingCharges?: number;
  gemstonesCost?: number;
  diamondsCost?: number;
  silverBillingMode?: "live_rate" | "fixed_rate";
  fixedRatePerGram?: number;
}

export class PricingCalculator {
  private static GST_RATE = 0.03; // 3% GST

  /**
   * Calculate comprehensive pricing breakdown for jewelry
   */
  static async calculatePrice(productData: ProductPricingData): Promise<PricingBreakdown> {
    const {
      productType,
      material,
      weight,
      makingCharges = 0,
      gemstonesCost = 0,
      diamondsCost = 0,
      silverBillingMode = "live_rate",
      fixedRatePerGram = 0
    } = productData;

    // Skip pricing calculation for imitation jewelry (use fixed price)
    if (productType === "imitation") {
      return this.createImitationPricing(weight);
    }

    let ratePerGram = 0;

    // Get rate per gram based on material and billing mode
    if (material?.toLowerCase().includes("gold")) {
      ratePerGram = await this.getGoldRatePerGram(material);
    } else if (material?.toLowerCase().includes("silver")) {
      ratePerGram = await this.getSilverRatePerGram(silverBillingMode, fixedRatePerGram);
    }

    // Calculate metal cost (weight × rate per gram)
    const metalCost = weight * ratePerGram;

    // Calculate subtotal before GST
    const subtotal = metalCost + makingCharges + gemstonesCost + diamondsCost;

    // Calculate GST (3%)
    const gstAmount = subtotal * this.GST_RATE;

    // Calculate final price
    const finalPrice = subtotal + gstAmount;

    return {
      weightInGrams: weight,
      ratePerGram,
      metalCost,
      makingCharges,
      gemstonesCost,
      diamondsCost,
      subtotal,
      gstAmount,
      finalPrice
    };
  }

  /**
   * Get live gold rate per gram based on purity
   */
  private static async getGoldRatePerGram(material: string): Promise<number> {
    const rates = await marketRatesService.getCurrentRates();
    
    // Determine purity from material
    const purity = this.extractPurityFromMaterial(material);
    
    switch (purity) {
      case "24k":
        return parseFloat(rates.gold24k) || 0;
      case "22k":
        return parseFloat(rates.gold22k) || 0;
      case "18k":
        return parseFloat(rates.gold18k) || 0;
      default:
        return parseFloat(rates.gold22k) || 0; // Default to 22k
    }
  }

  /**
   * Get silver rate per gram based on billing mode
   */
  private static async getSilverRatePerGram(
    billingMode: "live_rate" | "fixed_rate",
    fixedRate?: number
  ): Promise<number> {
    if (billingMode === "fixed_rate" && fixedRate) {
      return fixedRate;
    }

    // Use live silver rate
    const rates = await marketRatesService.getCurrentRates();
    return parseFloat(rates.silver) || 0;
  }

  /**
   * Extract purity from material string
   */
  private static extractPurityFromMaterial(material: string): string {
    const materialLower = material.toLowerCase();
    
    if (materialLower.includes("24k") || materialLower.includes("24 k")) {
      return "24k";
    } else if (materialLower.includes("22k") || materialLower.includes("22 k")) {
      return "22k";
    } else if (materialLower.includes("18k") || materialLower.includes("18 k")) {
      return "18k";
    }
    
    return "22k"; // Default
  }

  /**
   * Create simple pricing for imitation jewelry (no weight-based calculation)
   */
  private static createImitationPricing(weight: number): PricingBreakdown {
    return {
      weightInGrams: weight,
      ratePerGram: 0,
      metalCost: 0,
      makingCharges: 0,
      gemstonesCost: 0,
      diamondsCost: 0,
      subtotal: 0,
      gstAmount: 0,
      finalPrice: 0 // Will use fixed product price
    };
  }

  /**
   * Calculate pricing for cart items
   */
  static async calculateCartItemPrice(
    productData: ProductPricingData,
    quantity: number = 1
  ): Promise<PricingBreakdown> {
    const singleItemPrice = await this.calculatePrice(productData);
    
    return {
      ...singleItemPrice,
      metalCost: singleItemPrice.metalCost * quantity,
      makingCharges: singleItemPrice.makingCharges * quantity,
      gemstonesCost: singleItemPrice.gemstonesCost * quantity,
      diamondsCost: singleItemPrice.diamondsCost * quantity,
      subtotal: singleItemPrice.subtotal * quantity,
      gstAmount: singleItemPrice.gstAmount * quantity,
      finalPrice: singleItemPrice.finalPrice * quantity
    };
  }

  /**
   * Format pricing breakdown for display
   */
  static formatPricingBreakdown(breakdown: PricingBreakdown): {
    [key: string]: string;
  } {
    return {
      weight: `${breakdown.weightInGrams}g`,
      ratePerGram: `₹${breakdown.ratePerGram.toFixed(2)}/g`,
      metalCost: `₹${breakdown.metalCost.toFixed(2)}`,
      makingCharges: `₹${breakdown.makingCharges.toFixed(2)}`,
      gemstonesCost: `₹${breakdown.gemstonesCost.toFixed(2)}`,
      diamondsCost: `₹${breakdown.diamondsCost.toFixed(2)}`,
      subtotal: `₹${breakdown.subtotal.toFixed(2)}`,
      gstAmount: `₹${breakdown.gstAmount.toFixed(2)} (3%)`,
      finalPrice: `₹${breakdown.finalPrice.toFixed(2)}`
    };
  }
}