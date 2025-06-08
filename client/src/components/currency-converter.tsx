import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ExchangeRate {
  base: string;
  date: string;
  rates: Record<string, number>;
  timestamp: string;
  fallback?: boolean;
}

interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  convertedAmount: number;
  timestamp: string;
}

const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch live exchange rates
  const { data: exchangeRates, isLoading: ratesLoading, refetch: refetchRates } = useQuery({
    queryKey: ["/api/currency/rates", fromCurrency],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/currency/rates?base=${fromCurrency}&currencies=USD,EUR,GBP,AED,INR`);
      return response as ExchangeRate;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  // Currency conversion mutation
  const convertMutation = useMutation({
    mutationFn: (data: { amount: string; from: string; to: string }) =>
      apiRequest("POST", "/api/currency/convert", data),
    onSuccess: () => {
      setLastUpdated(new Date());
    },
  });

  // Auto-convert when amount or currencies change
  useEffect(() => {
    if (amount && fromCurrency && toCurrency && amount !== "0") {
      convertMutation.mutate({
        amount,
        from: fromCurrency,
        to: toCurrency,
      });
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return `${currency?.symbol || currencyCode} ${value.toLocaleString()}`;
  };

  const getRateChange = (currentRate: number, previousRate: number) => {
    const change = ((currentRate - previousRate) / previousRate) * 100;
    return change;
  };

  const conversionResult = convertMutation.data as ConversionResult;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Converter Card */}
      <Card className="border-gold/20 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-deep-navy flex items-center justify-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-gold" />
            Real-Time Currency Converter
          </CardTitle>
          <CardDescription>
            Convert jewelry prices with live exchange rates
            {exchangeRates?.fallback && (
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                Using fallback rates
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg font-semibold border-gold/30 focus:border-gold"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="border-gold/30 focus:border-gold">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{currencies.find(c => c.code === fromCurrency)?.flag}</span>
                      <span>{fromCurrency}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code} - {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapCurrencies}
                className="rounded-full border-gold/30 hover:bg-gold/10 hover:border-gold"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="border-gold/30 focus:border-gold">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{currencies.find(c => c.code === toCurrency)?.flag}</span>
                      <span>{toCurrency}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code} - {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Result */}
          {conversionResult && (
            <div className="bg-gradient-to-r from-gold/5 to-amber-50 p-6 rounded-lg border border-gold/20">
              <div className="text-center space-y-3">
                <div className="text-sm text-gray-600">
                  {formatCurrency(conversionResult.amount, conversionResult.from)} equals
                </div>
                <div className="text-3xl font-bold text-deep-navy">
                  {formatCurrency(conversionResult.convertedAmount, conversionResult.to)}
                </div>
                <div className="text-sm text-gray-500">
                  Exchange rate: 1 {conversionResult.from} = {conversionResult.rate.toFixed(6)} {conversionResult.to}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {convertMutation.isPending && (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="w-5 h-5 animate-spin text-gold mr-2" />
              <span className="text-gray-600">Converting...</span>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRates()}
              disabled={ratesLoading}
              className="border-gold/30 hover:bg-gold/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${ratesLoading ? 'animate-spin' : ''}`} />
              Refresh Rates
            </Button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates Table */}
      {exchangeRates && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-lg text-deep-navy">
              Current Exchange Rates (Base: {exchangeRates.base})
            </CardTitle>
            <CardDescription>
              Live rates updated on {new Date(exchangeRates.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(exchangeRates.rates)
                .filter(([code]) => code !== exchangeRates.base)
                .map(([currencyCode, rate]) => {
                  const currency = currencies.find(c => c.code === currencyCode);
                  return (
                    <div key={currencyCode} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{currency?.flag}</span>
                          <span className="font-medium">{currencyCode}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {currency?.symbol}{rate.toFixed(4)}
                          </div>
                          <div className="text-xs text-gray-500">
                            per {exchangeRates.base}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Conversion Presets */}
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="text-lg text-deep-navy">Quick Conversions</CardTitle>
          <CardDescription>Common jewelry price ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["1000", "5000", "10000", "25000", "50000", "100000", "250000", "500000"].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset)}
                className="border-gold/30 hover:bg-gold/10 text-xs"
              >
                ₹{parseInt(preset).toLocaleString()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}