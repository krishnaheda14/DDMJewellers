import { storage } from "./storage";

// Live market rates service for gold and silver
export class MarketRatesService {
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 5 * 60 * 1000; // Update every 5 minutes

  constructor() {
    this.startPeriodicUpdates();
  }

  // Start periodic updates
  startPeriodicUpdates() {
    console.log("Starting market rates updates...");
    
    // Initial update
    this.updateRates();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateRates();
    }, this.UPDATE_INTERVAL_MS);
  }

  // Stop periodic updates
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("Market rates updates stopped");
    }
  }

  // Fetch live gold and silver rates from multiple APIs
  async updateRates() {
    try {
      console.log("Updating market rates...");
      
      // Try multiple data sources for reliability
      const rates = await this.fetchFromMetalsAPI() || 
                   await this.fetchFromAlphaVantage() ||
                   await this.fetchFromFinnhub() ||
                   await this.fetchFromFreeAPI();

      if (rates) {
        await storage.createGoldRate({
          rate24k: rates.gold24k.toString(),
          rate22k: rates.gold22k.toString(),
          rate18k: rates.gold18k.toString(),
          silverRate: rates.silver.toString(),
          currency: 'USD',
          source: rates.source,
          effectiveDate: new Date()
        });
        
        console.log(`Market rates updated: Gold 24k: $${rates.gold24k}, Silver: $${rates.silver}`);
      } else {
        console.error("Failed to fetch market rates from all sources");
      }
    } catch (error) {
      console.error("Error updating market rates:", error);
    }
  }

  // Primary source: Metals-API (requires API key)
  private async fetchFromMetalsAPI() {
    try {
      if (!process.env.METALS_API_KEY) {
        return null;
      }

      const response = await fetch(`https://api.metals.live/v1/spot?api_key=${process.env.METALS_API_KEY}&currency=USD&unit=oz`);
      
      if (!response.ok) {
        throw new Error(`Metals API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert USD to INR and per ounce to per gram
      const usdToInr = 83;
      
      return {
        gold24k: (data.gold * usdToInr) / 31.1035, // Convert to INR per gram
        gold22k: (data.gold * usdToInr * 0.916) / 31.1035, // 22k is 91.6% pure
        gold18k: (data.gold * usdToInr * 0.75) / 31.1035,  // 18k is 75% pure
        silver: (data.silver * usdToInr) / 31.1035,
        source: 'Metals-API'
      };
    } catch (error) {
      console.log("Metals-API fetch failed:", error.message);
      return null;
    }
  }

  // Secondary source: Alpha Vantage (requires API key)
  private async fetchFromAlphaVantage() {
    try {
      if (!process.env.ALPHA_VANTAGE_API_KEY) {
        return null;
      }

      const [goldResponse, silverResponse] = await Promise.all([
        fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`),
        fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAG&to_currency=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`)
      ]);

      if (!goldResponse.ok || !silverResponse.ok) {
        throw new Error("Alpha Vantage API error");
      }

      const goldData = await goldResponse.json();
      const silverData = await silverResponse.json();

      const goldPrice = parseFloat(goldData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
      const silverPrice = parseFloat(silverData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);

      // Convert from per ounce to per gram and calculate different purities
      const goldPricePerOz = 1 / goldPrice; // XAU to USD gives USD per ounce
      const silverPricePerOz = 1 / silverPrice;
      
      // Convert USD to INR and per ounce to per gram
      const usdToInr = 83;

      return {
        gold24k: (goldPricePerOz * usdToInr) / 31.1035,
        gold22k: (goldPricePerOz * usdToInr * 0.916) / 31.1035,
        gold18k: (goldPricePerOz * usdToInr * 0.75) / 31.1035,
        silver: (silverPricePerOz * usdToInr) / 31.1035,
        source: 'Alpha Vantage'
      };
    } catch (error) {
      console.log("Alpha Vantage fetch failed:", error.message);
      return null;
    }
  }

  // Tertiary source: Finnhub (requires API key)
  private async fetchFromFinnhub() {
    try {
      if (!process.env.FINNHUB_API_KEY) {
        return null;
      }

      const [goldResponse, silverResponse] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=OANDA:XAU_USD&token=${process.env.FINNHUB_API_KEY}`),
        fetch(`https://finnhub.io/api/v1/quote?symbol=OANDA:XAG_USD&token=${process.env.FINNHUB_API_KEY}`)
      ]);

      if (!goldResponse.ok || !silverResponse.ok) {
        throw new Error("Finnhub API error");
      }

      const goldData = await goldResponse.json();
      const silverData = await silverResponse.json();

      // Convert USD to INR and per ounce to per gram
      const usdToInr = 83;
      
      return {
        gold24k: (goldData.c * usdToInr) / 31.1035, // Convert to INR per gram
        gold22k: (goldData.c * usdToInr * 0.916) / 31.1035,
        gold18k: (goldData.c * usdToInr * 0.75) / 31.1035,
        silver: (silverData.c * usdToInr) / 31.1035,
        source: 'Finnhub'
      };
    } catch (error) {
      console.log("Finnhub fetch failed:", error.message);
      return null;
    }
  }

  // Fallback: Free API with rate limiting
  private async fetchFromFreeAPI() {
    try {
      // Using metals-api.com free tier (50 requests/month)
      const response = await fetch('https://api.metals.live/v1/spot/gold,silver');
      
      if (!response.ok) {
        throw new Error(`Free API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert USD to INR (approximate rate: 1 USD = 83 INR)
      const usdToInr = 83;
      const goldPriceUsd = data.gold || 2000;
      const silverPriceUsd = data.silver || 25;
      
      return {
        gold24k: (goldPriceUsd * usdToInr) / 31.1035, // Convert per ounce to per gram
        gold22k: (goldPriceUsd * usdToInr * 0.916) / 31.1035,
        gold18k: (goldPriceUsd * usdToInr * 0.75) / 31.1035,
        silver: (silverPriceUsd * usdToInr) / 31.1035,
        source: 'Free Metals API'
      };
    } catch (error) {
      console.log("Free API fetch failed, using sample rates:", (error as Error).message);
      // Return realistic INR rates per gram for demonstration
      return {
        gold24k: 6800.00, // INR per gram
        gold22k: 6200.00, // INR per gram
        gold18k: 5100.00, // INR per gram
        silver: 82.50,    // INR per gram
        source: 'Sample Data (Demo)'
      };
    }
  }

  // Get current rates from database
  async getCurrentRates() {
    try {
      return await storage.getCurrentGoldRates();
    } catch (error) {
      console.error("Error fetching current rates:", error);
      return null;
    }
  }

  // Convert prices between currencies (placeholder for future expansion)
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // For now, return the amount as-is
    // In production, integrate with a currency conversion API
    return amount;
  }

  // Calculate jewelry prices based on current market rates
  async calculateJewelryPrice(weightInGrams: number, purity: '24k' | '22k' | '18k', markup: number = 1.3) {
    const rates = await this.getCurrentRates();
    if (!rates) {
      throw new Error("Market rates not available");
    }

    let basePrice: number;
    switch (purity) {
      case '24k':
        basePrice = parseFloat(rates.rate24k);
        break;
      case '22k':
        basePrice = parseFloat(rates.rate22k);
        break;
      case '18k':
        basePrice = parseFloat(rates.rate18k);
        break;
      default:
        throw new Error("Invalid purity specified");
    }

    // Convert from per ounce to per gram (1 ounce = 31.1035 grams)
    const pricePerGram = basePrice / 31.1035;
    
    // Calculate final price with markup
    return (pricePerGram * weightInGrams * markup).toFixed(2);
  }
}

// Export singleton instance
export const marketRatesService = new MarketRatesService();