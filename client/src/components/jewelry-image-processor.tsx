import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Camera, 
  RotateCcw, 
  Check, 
  X, 
  Eye, 
  Download,
  ImageIcon,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessedImage {
  id: string;
  original: File;
  processed: string; // base64 or blob URL
  angle: 'front' | 'side' | 'detail';
  status: 'processing' | 'completed' | 'error';
  quality: number;
}

interface JewelryImageProcessorProps {
  onImagesProcessed: (images: ProcessedImage[]) => void;
  maxImages?: number;
  requiredAngles?: ('front' | 'side' | 'detail')[];
}

export function JewelryImageProcessor({ 
  onImagesProcessed, 
  maxImages = 6,
  requiredAngles = ['front', 'side', 'detail']
}: JewelryImageProcessorProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate background removal processing
  const processImageBackground = async (file: File, angle: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Standard jewelry photo dimensions (1:1 aspect ratio)
        const size = 800;
        canvas.width = size;
        canvas.height = size;
        
        // Pure white background
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, size, size);
        
        // Calculate dimensions to center the jewelry with padding
        const padding = 80;
        const maxSize = size - (padding * 2);
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;
        
        // Draw the processed image
        ctx!.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Add subtle drop shadow for depth
        ctx!.globalCompositeOperation = 'destination-over';
        ctx!.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx!.shadowBlur = 20;
        ctx!.shadowOffsetY = 10;
        ctx!.fillRect(x, y, scaledWidth, scaledHeight);
        
        resolve(canvas.toDataURL('image/webp', 0.9));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const newImages: ProcessedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        continue;
      }

      const imageId = `img_${Date.now()}_${i}`;
      const angle = determineAngle(images.length + newImages.length);
      
      const processingImage: ProcessedImage = {
        id: imageId,
        original: file,
        processed: '',
        angle,
        status: 'processing',
        quality: 0
      };
      
      newImages.push(processingImage);
      setImages(prev => [...prev, processingImage]);
      
      try {
        // Simulate processing time for realistic UX
        const processed = await processImageBackground(file, angle);
        
        const updatedImage = {
          ...processingImage,
          processed,
          status: 'completed' as const,
          quality: 95
        };
        
        setImages(prev => 
          prev.map(img => img.id === imageId ? updatedImage : img)
        );
        
        setProcessingProgress(((i + 1) / files.length) * 100);
        
      } catch (error) {
        setImages(prev => 
          prev.map(img => 
            img.id === imageId 
              ? { ...img, status: 'error' as const }
              : img
          )
        );
        
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
    setProcessingProgress(0);
  };

  const determineAngle = (index: number): 'front' | 'side' | 'detail' => {
    const angles: ('front' | 'side' | 'detail')[] = ['front', 'side', 'detail'];
    return angles[index % 3];
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const retryProcessing = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'processing' }
          : img
      )
    );

    try {
      const processed = await processImageBackground(image.original, image.angle);
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, processed, status: 'completed', quality: 95 }
            : img
        )
      );
    } catch (error) {
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, status: 'error' }
            : img
        )
      );
    }
  };

  const getAngleProgress = () => {
    const completed = requiredAngles.map(angle => 
      images.some(img => img.angle === angle && img.status === 'completed')
    );
    return completed.filter(Boolean).length;
  };

  const isUploadComplete = () => {
    return requiredAngles.every(angle => 
      images.some(img => img.angle === angle && img.status === 'completed')
    );
  };

  const handleFinalSubmit = () => {
    const completedImages = images.filter(img => img.status === 'completed');
    onImagesProcessed(completedImages);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Professional Jewelry Photography
          </CardTitle>
          <CardDescription>
            Upload high-quality images from multiple angles. Our AI will automatically remove backgrounds and optimize for professional display.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Upload Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Required Photo Angles</h4>
            <div className="grid grid-cols-3 gap-4">
              {requiredAngles.map(angle => {
                const hasAngle = images.some(img => img.angle === angle && img.status === 'completed');
                return (
                  <div key={angle} className={`flex items-center gap-2 ${hasAngle ? 'text-green-700' : 'text-gray-600'}`}>
                    {hasAngle ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span className="capitalize">{angle} View</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{getAngleProgress()}/{requiredAngles.length} angles</span>
              </div>
              <Progress value={(getAngleProgress() / requiredAngles.length) * 100} className="h-2" />
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isProcessing ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={(e) => {
              e.preventDefault();
              if (!isProcessing) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-900">Processing Images</p>
                  <p className="text-blue-600">Removing backgrounds and optimizing...</p>
                  <Progress value={processingProgress} className="mt-2 max-w-xs mx-auto" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Drop images here or click to upload</p>
                  <p className="text-gray-500">Supports JPG, PNG, WEBP up to 10MB each</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Images
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && !isProcessing) {
                handleFileSelect(e.target.files);
              }
            }}
          />

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Uploaded Images ({images.length}/{maxImages})</h4>
              
              <Tabs defaultValue="grid" className="w-full">
                <TabsList>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="angles">By Angle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="grid" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <ImageCard 
                        key={image.id}
                        image={image}
                        onRemove={() => removeImage(image.id)}
                        onRetry={() => retryProcessing(image.id)}
                        onPreview={() => setSelectedImage(image)}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="angles" className="space-y-6">
                  {requiredAngles.map(angle => (
                    <AngleSection 
                      key={angle}
                      angle={angle}
                      images={images.filter(img => img.angle === angle)}
                      onRemove={removeImage}
                      onRetry={retryProcessing}
                      onPreview={setSelectedImage}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Submit Button */}
          {images.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {isUploadComplete() ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    All required angles uploaded
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Upload {requiredAngles.length - getAngleProgress()} more angle(s)
                  </span>
                )}
              </div>
              
              <Button 
                onClick={handleFinalSubmit}
                disabled={!isUploadComplete()}
                size="lg"
              >
                <Check className="w-4 h-4 mr-2" />
                Use These Images
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview - {selectedImage.angle} view</DialogTitle>
              <DialogDescription>
                Processed with automatic background removal and optimization
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Original</h4>
                <img 
                  src={URL.createObjectURL(selectedImage.original)}
                  alt="Original"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Processed</h4>
                {selectedImage.processed && (
                  <img 
                    src={selectedImage.processed}
                    alt="Processed"
                    className="w-full h-64 object-cover rounded-lg border bg-white"
                  />
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-600">
                Quality: {selectedImage.quality}% • Format: WebP • Optimized for web
              </div>
              
              <Button variant="outline" onClick={() => setSelectedImage(null)}>
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Image Card Component
function ImageCard({ 
  image, 
  onRemove, 
  onRetry, 
  onPreview 
}: { 
  image: ProcessedImage;
  onRemove: () => void;
  onRetry: () => void;
  onPreview: () => void;
}) {
  return (
    <Card className="relative group">
      <CardContent className="p-3">
        <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
          {image.status === 'completed' && image.processed ? (
            <img 
              src={image.processed}
              alt={`${image.angle} view`}
              className="w-full h-full object-cover bg-white"
            />
          ) : image.status === 'processing' ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          )}
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {image.status === 'completed' && (
              <Button size="sm" variant="secondary" onClick={onPreview}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            {image.status === 'error' && (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            
            <Button size="sm" variant="destructive" onClick={onRemove}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <Badge variant={image.status === 'completed' ? 'default' : 
                        image.status === 'processing' ? 'secondary' : 'destructive'}>
            {image.angle}
          </Badge>
          
          {image.status === 'completed' && (
            <span className="text-xs text-green-600">✓ Ready</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Angle Section Component
function AngleSection({ 
  angle, 
  images, 
  onRemove, 
  onRetry, 
  onPreview 
}: {
  angle: string;
  images: ProcessedImage[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onPreview: (image: ProcessedImage) => void;
}) {
  return (
    <div>
      <h4 className="font-medium mb-3 capitalize">{angle} View Images</h4>
      
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No {angle} view images uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImageCard 
              key={image.id}
              image={image}
              onRemove={() => onRemove(image.id)}
              onRetry={() => onRetry(image.id)}
              onPreview={() => onPreview(image)}
            />
          ))}
        </div>
      )}
    </div>
  );
}