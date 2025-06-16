import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Upload, ImagePlus, X, ArrowLeft, Package, Gem, Weight, DollarSign, Camera, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import PageNavigation from '@/components/page-navigation';
import { JewelryImageProcessor } from '@/components/jewelry-image-processor';

interface ProcessedImage {
  id: string;
  original: File;
  processed: string;
  angle: 'front' | 'side' | 'detail';
  status: 'processing' | 'completed' | 'error';
  quality: number;
}

interface ProductUpload {
  name: string;
  description: string;
  category: string;
  productType: 'real' | 'imitation';
  material: string;
  weight: number;
  purity: string;
  images: File[];
  processedImages: ProcessedImage[];
  price?: number;
  makingCharges?: number;
  gemstonesCost?: number;
  diamondsCost?: number;
  tags: string[];
}

export default function WholesalerUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTag, setCurrentTag] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ProductUpload>({
    name: '',
    description: '',
    category: '',
    productType: 'real',
    material: '',
    weight: 0,
    purity: '',
    images: [],
    processedImages: [],
    tags: []
  });

  const [showImageProcessor, setShowImageProcessor] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('POST', '/api/wholesaler/products/upload', data);
    },
    onSuccess: () => {
      toast({
        title: 'Product Uploaded Successfully',
        description: 'Your product has been submitted for admin review.',
      });
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        productType: 'real',
        material: '',
        weight: 0,
        purity: '',
        images: [],
        tags: []
      });
      setPreviewImages([]);
      queryClient.invalidateQueries({ queryKey: ['/api/wholesaler/products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 5) {
      toast({
        title: 'Too Many Images',
        description: 'Maximum 5 images allowed per product.',
        variant: 'destructive',
      });
      return;
    }

    const newImages = [...formData.images, ...files];
    setFormData({ ...formData, images: newImages });

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setPreviewImages(newPreviews);
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: 'No Images',
        description: 'Please upload at least one product image.',
        variant: 'destructive',
      });
      return;
    }

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        formData.images.forEach(image => submitData.append('images', image));
      } else if (key === 'tags') {
        submitData.append('tags', JSON.stringify(formData.tags));
      } else {
        submitData.append(key, String(value));
      }
    });

    uploadMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <PageNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/wholesaler/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Products</h1>
            <p className="text-gray-600 mt-1">Add new jewelry products to your wholesale catalog</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
            <CardDescription>
              Fill in the details below to upload your jewelry products. All uploads are subject to admin approval.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gold Diamond Necklace"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="necklace">Necklace</SelectItem>
                      <SelectItem value="earrings">Earrings</SelectItem>
                      <SelectItem value="rings">Rings</SelectItem>
                      <SelectItem value="bracelets">Bracelets</SelectItem>
                      <SelectItem value="bangles">Bangles</SelectItem>
                      <SelectItem value="pendants">Pendants</SelectItem>
                      <SelectItem value="chains">Chains</SelectItem>
                      <SelectItem value="anklets">Anklets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the product..."
                  rows={4}
                  required
                />
              </div>

              {/* Product Type and Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select 
                    value={formData.productType} 
                    onValueChange={(value: 'real' | 'imitation') => setFormData({ ...formData, productType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real">Real Jewelry</SelectItem>
                      <SelectItem value="imitation">Imitation Jewelry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g., 22K Gold, Silver, Brass"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Pricing (optional for wholesalers) */}
              {formData.productType === 'imitation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                      placeholder="Fixed price for imitation jewelry"
                    />
                  </div>
                </div>
              )}

              {formData.productType === 'real' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="makingCharges">Making Charges (₹)</Label>
                    <Input
                      id="makingCharges"
                      type="number"
                      value={formData.makingCharges || ''}
                      onChange={(e) => setFormData({ ...formData, makingCharges: parseFloat(e.target.value) || undefined })}
                      placeholder="Per gram making charges"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gemstonesCost">Gemstones Cost (₹)</Label>
                    <Input
                      id="gemstonesCost"
                      type="number"
                      value={formData.gemstonesCost || ''}
                      onChange={(e) => setFormData({ ...formData, gemstonesCost: parseFloat(e.target.value) || undefined })}
                      placeholder="Total gemstones cost"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="diamondsCost">Diamonds Cost (₹)</Label>
                    <Input
                      id="diamondsCost"
                      type="number"
                      value={formData.diamondsCost || ''}
                      onChange={(e) => setFormData({ ...formData, diamondsCost: parseFloat(e.target.value) || undefined })}
                      placeholder="Total diamonds cost"
                    />
                  </div>
                </div>
              )}

              {/* Professional Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Professional Product Photography *
                  </Label>
                  {formData.processedImages && formData.processedImages.length > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {formData.processedImages.length} images ready
                    </Badge>
                  )}
                </div>
                
                <JewelryImageProcessor
                  onImagesProcessed={(processedImages) => {
                    setFormData(prev => ({
                      ...prev,
                      processedImages,
                      images: processedImages.map(img => img.original)
                    }));
                    setPreviewImages(processedImages.map(img => img.processed));
                  }}
                  maxImages={6}
                  requiredAngles={['front', 'side', 'detail']}
                />
                
                {formData.processedImages.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Studio-Quality Images Ready</h4>
                    <p className="text-sm text-green-700">
                      Your jewelry images have been processed with automatic background removal and optimized for professional display.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      {formData.processedImages.map((img, index) => (
                        <div key={img.id} className="text-center">
                          <img
                            src={img.processed}
                            alt={`${img.angle} view`}
                            className="w-full h-20 object-cover rounded-lg border bg-white"
                          />
                          <Badge variant="outline" className="mt-1 text-xs">
                            {img.angle}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add tags (e.g., traditional, modern, bridal)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6">
                <Button type="button" variant="outline" asChild>
                  <Link href="/wholesaler/dashboard">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}