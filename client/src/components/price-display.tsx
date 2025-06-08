import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PriceDisplayProps {
  price: string | number;
  currency?: string;
  showConversions?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}

const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

export default function PriceDisplay({ 
  price, 
  currency = "INR", 
  showConversions = false,
  className = "",
  size = "md"
}: PriceDisplayProps) {
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);

  // Get exchange rates
  const { data: exchangeRates, isLoading } = useQuery({
    queryKey: ["/api/currency/rates", currency],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/currency/rates?base=${currency}&currencies=USD,EUR,GBP,AED,INR`);
      return response as ExchangeRate;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
    enabled: showConversions || selectedCurrency !== currency,
  });

  // Convert price when currency changes
  useEffect(() => {
    if (exchangeRates && selectedCurrency !== currency) {
      const rate = exchangeRates.rates[selectedCurrency];
      if (rate) {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        setConvertedPrice(numPrice * rate);
      }
    } else {
      setConvertedPrice(null);
    }
  }, [exchangeRates, selectedCurrency, currency, price]);

  // Listen to global currency selection changes
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.currency);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  const formatPrice = (value: number, currencyCode: string) => {
    const currencyInfo = currencies.find(c => c.code === currencyCode);
    const symbol = currencyInfo?.symbol || currencyCode;
    
    // Format based on currency
    if (currencyCode === 'INR') {
      return `${symbol}${value.toLocaleString('en-IN')}`;
    }
    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-xl font-bold';
      default: return 'text-base font-semibold';
    }
  };

  const originalPrice = typeof price === 'string' ? parseFloat(price) : price;
  const displayPrice = convertedPrice || originalPrice;
  const displayCurrency = convertedPrice ? selectedCurrency : currency;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main Price */}
      <div className={`text-deep-navy ${getTextSizeClass()}`}>
        {isLoading && convertedPrice === null && selectedCurrency !== currency ? (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>{formatPrice(originalPrice, currency)}</span>
          </div>
        ) : (
          formatPrice(displayPrice, displayCurrency)
        )}
      </div>

      {/* Conversion Info */}
      {convertedPrice && selectedCurrency !== currency && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            ≈ {formatPrice(originalPrice, currency)}
          </span>
          {exchangeRates && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              1 {currency} = {exchangeRates.rates[selectedCurrency]?.toFixed(4)} {selectedCurrency}
            </Badge>
          )}
        </div>
      )}

      {/* Show all conversions */}
      {showConversions && exchangeRates && (
        <div className="grid grid-cols-2 gap-1 mt-2">
          {Object.entries(exchangeRates.rates)
            .filter(([code]) => code !== currency)
            .slice(0, 4)
            .map(([currencyCode, rate]) => {
              const convertedAmount = originalPrice * rate;
              return (
                <div key={currencyCode} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  <span className="font-medium">{currencyCode}:</span>
                  <span className="ml-1">{formatPrice(convertedAmount, currencyCode)}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// Currency context hook for global currency selection
export function useCurrencyContext() {
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const changeCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    // Dispatch custom event for price components to listen
    window.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: { currency }
    }));
  };

  return {
    selectedCurrency,
    changeCurrency,
  };
}