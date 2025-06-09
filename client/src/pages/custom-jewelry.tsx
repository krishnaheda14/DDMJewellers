import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, CheckCircle, Sparkles, Home, ArrowLeft } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageNavigation from "@/components/page-navigation";

interface UploadResponse {
  message: string;
  designId: number;
  fileName: string;
  filePath: string;
}

export default function CustomJewelry() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/custom-jewelry/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "Design Uploaded Successfully!",
        description: "Our team will review your custom jewelry request and contact you soon.",
      });
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription("");
      setContactInfo("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1000);
        return;
      }
      toast({
        title: "Upload Failed",
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('design', selectedFile);
    formData.append('description', description);
    formData.append('contactInfo', contactInfo);

    uploadMutation.mutate(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-deep-navy mb-4">Sign In Required</h2>
              <p className="text-warm-gray mb-6">Please sign in to upload your custom jewelry design.</p>
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
      <PageNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy mb-4">Custom Jewelry Design</h1>
          <p className="text-warm-gray text-lg">
            Upload your design ideas and let our master craftsmen bring your vision to life
          </p>
        </div>

        {uploadResult ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-deep-navy mb-2">Upload Successful!</h3>
              <p className="text-warm-gray mb-4">{uploadResult.message}</p>
              <p className="text-sm text-warm-gray">
                Design ID: #{uploadResult.designId}
              </p>
              <Button
                onClick={() => setUploadResult(null)}
                variant="outline"
                className="mt-4"
              >
                Upload Another Design
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Design Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <Label htmlFor="design-file">Design Image *</Label>
                    <div className="mt-2">
                      <label htmlFor="design-file" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold transition-colors">
                          {previewUrl ? (
                            <div className="space-y-2">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-40 mx-auto rounded"
                              />
                              <p className="text-sm text-warm-gray">
                                {selectedFile?.name}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-12 w-12 mx-auto text-gray-400" />
                              <p className="text-warm-gray">
                                Click to upload your design
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                      <input
                        id="design-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Design Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your design ideas, preferred materials, size specifications, etc."
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  {/* Contact Info */}
                  <div>
                    <Label htmlFor="contact">Contact Information</Label>
                    <Input
                      id="contact"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="Phone number or preferred contact method"
                      className="mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={uploadMutation.isPending || !selectedFile}
                    className="w-full bg-gold hover:bg-gold/90"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Submit Design Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-gold" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-deep-navy">Upload Your Design</h4>
                      <p className="text-sm text-warm-gray">
                        Share your sketch, reference image, or inspiration photo
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-deep-navy">Expert Review</h4>
                      <p className="text-sm text-warm-gray">
                        Our designers will review your concept and provide feedback
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-deep-navy">Quote & Timeline</h4>
                      <p className="text-sm text-warm-gray">
                        Receive a detailed quote and estimated completion time
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-deep-navy">Crafting & Delivery</h4>
                      <p className="text-sm text-warm-gray">
                        Watch your vision come to life with our master craftsmen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-deep-navy mb-2">What to Include:</h4>
                  <ul className="text-sm text-warm-gray space-y-1">
                    <li>• Clear, high-quality images</li>
                    <li>• Preferred materials (gold, silver, platinum)</li>
                    <li>• Size specifications</li>
                    <li>• Budget range (optional)</li>
                    <li>• Special occasions or significance</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}