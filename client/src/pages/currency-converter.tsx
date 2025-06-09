import CurrencyConverter from "@/components/currency-converter";
import PageNavigation from "@/components/page-navigation";

export default function CurrencyConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      <PageNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-deep-navy mb-4">
            Currency Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert jewelry prices across different currencies with real-time exchange rates. 
            Perfect for international customers and price comparisons.
          </p>
        </div>
        
        <CurrencyConverter />
        
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-gold/20 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-deep-navy mb-4">
              Why Use Our Currency Converter?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-deep-navy mb-2">Real-Time Rates</h3>
                <p>Get live exchange rates updated every minute for accurate pricing</p>
              </div>
              <div>
                <h3 className="font-medium text-deep-navy mb-2">Multiple Currencies</h3>
                <p>Support for INR, USD, EUR, GBP, and AED - perfect for our global customers</p>
              </div>
              <div>
                <h3 className="font-medium text-deep-navy mb-2">Instant Conversion</h3>
                <p>Convert jewelry prices instantly as you browse our collections</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}