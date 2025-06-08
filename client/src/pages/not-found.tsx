import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <Card className="w-full max-w-lg mx-4 shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-amber-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
            <p className="text-gray-600 mb-6">
              The page <code className="bg-gray-100 px-2 py-1 rounded text-sm">{location}</code> doesn't exist.
            </p>
            
            <div className="space-y-3 w-full">
              <Link href="/">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg w-full">
              <p className="text-sm text-gray-600 mb-3">Quick Links:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link href="/products" className="text-amber-600 hover:underline">Products</Link>
                <Link href="/shop" className="text-amber-600 hover:underline">Shop</Link>
                <Link href="/live-market-rates" className="text-amber-600 hover:underline">Market Rates</Link>
                <Link href="/jewelry-care" className="text-amber-600 hover:underline">Jewelry Care</Link>
                <Link href="/temp-login" className="text-amber-600 hover:underline">Login</Link>
                <Link href="/ai-tryon" className="text-amber-600 hover:underline">AI Try-On</Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
