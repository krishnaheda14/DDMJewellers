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
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Sparkles, ArrowRight, CheckCircle, Info } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product } from "@shared/schema";

interface TryOnResult {
  userId: string;
  productId: number;
  userPhotoPath: string;
  productName: string;
  productImage: string;
  processedImagePath: string;
  createdAt: Date;
}

interface TryOnResponse {
  message: string;
  result: TryOnResult;
  note: string;
}

export default function AITryOn() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<TryOnResponse | null>(null);
  const [step, setStep] = useState<'upload' | 'select' | 'process' | 'result'>('upload');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const tryOnMutation = useMutation({
    mutationFn: async ({ file, productId }: { file: File; productId: number }) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('productId', productId.toString());

      const response = await fetch('/api/ai-tryon/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Processing failed');
      }
      
      return response.json() as Promise<TryOnResponse>;
    },
    onSuccess: (data) => {
      setTryOnResult(data);
      setStep('result');
      toast({
        title: "Photo Processed!",
        description: "Your virtual try-on is ready.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setStep('select');
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep('process');
  };

  const handleTryOn = () => {
    if (!selectedFile || !selectedProduct) {
      toast({
        title: "Missing requirements",
        description: "Please upload a photo and select a product.",
        variant: "destructive",
      });
      return;
    }

    tryOnMutation.mutate({ file: selectedFile, productId: selectedProduct.id });
  };

  const resetTryOn = () => {
    setSelectedFile(null);
    setSelectedProduct(null);
    setPreviewUrl(null);
    setTryOnResult(null);
    setStep('upload');
  };

  // Filter products suitable for try-on (necklaces, earrings, bracelets, rings)
  const tryOnProducts = products.filter((product: Product) => 
    product.name.toLowerCase().includes('necklace') ||
    product.name.toLowerCase().includes('earring') ||
    product.name.toLowerCase().includes('bracelet') ||
    product.name.toLowerCase().includes('ring') ||
    product.categoryId // Include all categorized products
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-deep-navy mb-4">Sign In Required</h2>
              <p className="text-warm-gray mb-6">Please sign in to try on jewelry virtually.</p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gold hover:bg-gold/90"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-deep-navy mb-4">AI Virtual Try-On</h1>
          <p className="text-warm-gray text-lg">
            See how our jewelry looks on you before you buy
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-gold' : step === 'select' || step === 'process' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'upload' ? 'bg-gold text-white' : step === 'select' || step === 'process' || step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Upload Photo</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'select' ? 'text-gold' : step === 'process' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'select' ? 'bg-gold text-white' : step === 'process' || step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Select Jewelry</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'process' ? 'text-gold' : step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'process' ? 'bg-gold text-white' : step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Try On</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload Photo */}
        {step === 'upload' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-gold" />
                Upload Your Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="photo-file">Select a clear photo of yourself *</Label>
                  <div className="mt-2">
                    <label htmlFor="photo-file" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gold transition-colors">
                        {previewUrl ? (
                          <div className="space-y-2">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded"
                            />
                            <p className="text-sm text-warm-gray">
                              {selectedFile?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-16 w-16 mx-auto text-gray-400" />
                            <p className="text-warm-gray text-lg">
                              Click to upload your photo
                            </p>
                            <p className="text-sm text-gray-500">
                              For best results, use a clear front-facing photo with good lighting
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      id="photo-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Tips for Best Results:</h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Use good lighting (natural light works best)</li>
                        <li>• Face the camera directly</li>
                        <li>• Keep your hair away from ears/neck area</li>
                        <li>• Wear minimal existing jewelry</li>
                        <li>• Use a plain background if possible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Product */}
        {step === 'select' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Choose Jewelry to Try On
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {tryOnProducts.map((product: Product) => (
                    <div
                      key={product.id}
                      className={`cursor-pointer transition-all ${
                        selectedProduct?.id === product.id 
                          ? 'ring-2 ring-gold ring-offset-2' 
                          : 'hover:shadow-lg'
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <ProductCard product={product} />
                      {selectedProduct?.id === product.id && (
                        <div className="mt-2 text-center">
                          <Badge className="bg-gold text-white">Selected</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {tryOnProducts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-warm-gray">No jewelry available for try-on at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedProduct && (
              <div className="text-center">
                <Button
                  onClick={() => setStep('process')}
                  className="bg-gold hover:bg-gold/90"
                >
                  Continue to Try-On
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Process Try-On */}
        {step === 'process' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold" />
                Ready to Try On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Photo */}
                  <div>
                    <h4 className="font-semibold text-deep-navy mb-2">Your Photo</h4>
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Your photo"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  {/* Selected Product */}
                  <div>
                    <h4 className="font-semibold text-deep-navy mb-2">Selected Jewelry</h4>
                    {selectedProduct && (
                      <div className="space-y-2">
                        <img
                          src={selectedProduct.imageUrl || '/placeholder-jewelry.jpg'}
                          alt={selectedProduct.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-gold font-bold">₹{parseInt(selectedProduct.price).toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <Button
                    onClick={handleTryOn}
                    disabled={tryOnMutation.isPending}
                    className="bg-gold hover:bg-gold/90 px-8"
                    size="lg"
                  >
                    {tryOnMutation.isPending ? "Processing..." : "Generate Try-On"}
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setStep('upload')}>
                      Change Photo
                    </Button>
                    <Button variant="outline" onClick={() => setStep('select')}>
                      Change Jewelry
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Result */}
        {step === 'result' && tryOnResult && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your Virtual Try-On Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <img
                    src={tryOnResult.result.processedImagePath}
                    alt="Try-on result"
                    className="max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>

                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-deep-navy">
                    {tryOnResult.result.productName}
                  </h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm">{tryOnResult.note}</p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={resetTryOn}
                      variant="outline"
                    >
                      Try Another
                    </Button>
                    <Button
                      onClick={() => window.location.href = `/products/${tryOnResult.result.productId}`}
                      className="bg-gold hover:bg-gold/90"
                    >
                      View Product Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}