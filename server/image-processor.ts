import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessedImageResult {
  id: string;
  originalUrl: string;
  processedUrl: string;
  angle: 'front' | 'side' | 'detail';
  dimensions: { width: number; height: number };
  fileSize: number;
  format: string;
  quality: number;
}

export interface ImageProcessingOptions {
  outputSize: number;
  quality: number;
  format: 'webp' | 'png';
  backgroundColor: string;
  padding: number;
  addShadow: boolean;
}

export class JewelryImageProcessor {
  private readonly defaultOptions: ImageProcessingOptions = {
    outputSize: 800,
    quality: 90,
    format: 'webp',
    backgroundColor: '#FFFFFF',
    padding: 80,
    addShadow: true
  };

  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly processedDir = path.join(this.uploadsDir, 'processed');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Process jewelry image with background removal and optimization
   */
  async processJewelryImage(
    inputBuffer: Buffer,
    angle: 'front' | 'side' | 'detail',
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImageResult> {
    const opts = { ...this.defaultOptions, ...options };
    const imageId = uuidv4();
    
    try {
      // Get image metadata
      const metadata = await sharp(inputBuffer).metadata();
      
      // Create base canvas with white background
      const canvas = sharp({
        create: {
          width: opts.outputSize,
          height: opts.outputSize,
          channels: 4,
          background: opts.backgroundColor
        }
      });

      // Process the jewelry image
      let processedImage = sharp(inputBuffer);

      // Advanced background removal simulation
      // In a real implementation, this would use AI/ML services like Remove.bg API
      processedImage = await this.simulateBackgroundRemoval(processedImage, metadata);

      // Calculate optimal sizing with padding
      const maxSize = opts.outputSize - (opts.padding * 2);
      processedImage = processedImage.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Create shadow layer if enabled
      let compositeLayers: any[] = [];
      
      if (opts.addShadow) {
        const shadowBlur = 15;
        const shadowOffset = 8;
        
        // Create shadow
        const shadow = await processedImage
          .clone()
          .threshold(240) // Create mask for shadow
          .blur(shadowBlur)
          .tint({ r: 0, g: 0, b: 0 }) // Make it black
          .composite([{
            input: Buffer.from([0, 0, 0, 50]), // Semi-transparent black
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'multiply'
          }])
          .toBuffer();

        compositeLayers.push({
          input: shadow,
          top: opts.padding + shadowOffset,
          left: opts.padding + (shadowOffset / 2)
        });
      }

      // Add the main jewelry image
      const mainImageBuffer = await processedImage.toBuffer();
      compositeLayers.push({
        input: mainImageBuffer,
        top: opts.padding,
        left: opts.padding
      });

      // Composite final image
      const finalImage = await canvas
        .composite(compositeLayers)
        .webp({ quality: opts.quality, effort: 6 })
        .toBuffer();

      // Save processed image
      const fileName = `${imageId}-${angle}.${opts.format}`;
      const filePath = path.join(this.processedDir, fileName);
      await fs.writeFile(filePath, finalImage);

      // Get final metadata
      const finalMetadata = await sharp(finalImage).metadata();

      return {
        id: imageId,
        originalUrl: '', // Will be set by caller
        processedUrl: `/uploads/processed/${fileName}`,
        angle,
        dimensions: {
          width: finalMetadata.width || opts.outputSize,
          height: finalMetadata.height || opts.outputSize
        },
        fileSize: finalImage.length,
        format: opts.format,
        quality: opts.quality
      };

    } catch (error) {
      console.error('Error processing jewelry image:', error);
      throw new Error(`Failed to process ${angle} view image: ${error.message}`);
    }
  }

  /**
   * Simulate advanced background removal
   * In production, this would integrate with AI services like Remove.bg, Adobe, or custom ML models
   */
  private async simulateBackgroundRemoval(image: sharp.Sharp, metadata: sharp.Metadata): Promise<sharp.Sharp> {
    try {
      // For demo purposes, we'll enhance the image and improve contrast
      // Real implementation would use AI-powered background removal APIs
      
      return image
        .normalize() // Normalize contrast and brightness
        .sharpen({ sigma: 1.0, m1: 1.0, m2: 2.0 }) // Enhance edges
        .modulate({
          brightness: 1.1, // Slightly brighter
          saturation: 1.2  // More vibrant colors
        })
        .removeAlpha() // Remove any existing alpha channel
        .png({ compressionLevel: 9, adaptiveFiltering: true }); // High quality processing
        
    } catch (error) {
      console.error('Error in background removal simulation:', error);
      return image;
    }
  }

  /**
   * Batch process multiple jewelry images
   */
  async processJewelryImageSet(
    images: { buffer: Buffer; angle: 'front' | 'side' | 'detail' }[],
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = [];
    
    for (const { buffer, angle } of images) {
      try {
        const result = await this.processJewelryImage(buffer, angle, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${angle} image:`, error);
        // Continue processing other images even if one fails
      }
    }

    return results;
  }

  /**
   * Validate image for jewelry processing
   */
  async validateJewelryImage(buffer: Buffer): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const metadata = await sharp(buffer).metadata();
      
      // Check file format
      if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format || '')) {
        errors.push('Unsupported image format. Please use JPG, PNG, or WebP.');
      }

      // Check dimensions
      const minDimension = 400;
      const maxDimension = 4000;
      
      if ((metadata.width || 0) < minDimension || (metadata.height || 0) < minDimension) {
        errors.push(`Image too small. Minimum size is ${minDimension}x${minDimension}px.`);
      }
      
      if ((metadata.width || 0) > maxDimension || (metadata.height || 0) > maxDimension) {
        errors.push(`Image too large. Maximum size is ${maxDimension}x${maxDimension}px.`);
      }

      // Check file size (max 10MB)
      const maxFileSize = 10 * 1024 * 1024;
      if (buffer.length > maxFileSize) {
        errors.push('File size too large. Maximum size is 10MB.');
      }

      // Quality suggestions
      if ((metadata.width || 0) < 800 || (metadata.height || 0) < 800) {
        suggestions.push('For best results, use images with at least 800x800 resolution.');
      }

      if (metadata.density && metadata.density < 150) {
        suggestions.push('Higher DPI images (150+ DPI) produce better results.');
      }

      // Check aspect ratio
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        suggestions.push('Square or near-square images work best for jewelry photography.');
      }

      return {
        isValid: errors.length === 0,
        errors,
        suggestions
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid image file or corrupted data.'],
        suggestions: []
      };
    }
  }

  /**
   * Generate image thumbnail
   */
  async generateThumbnail(
    inputBuffer: Buffer,
    size: number = 200
  ): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  }

  /**
   * Create image comparison (before/after)
   */
  async createComparison(
    originalBuffer: Buffer,
    processedBuffer: Buffer
  ): Promise<Buffer> {
    const size = 400;
    
    // Resize both images to same size
    const original = await sharp(originalBuffer)
      .resize(size, size, { fit: 'cover' })
      .toBuffer();
      
    const processed = await sharp(processedBuffer)
      .resize(size, size, { fit: 'cover' })
      .toBuffer();

    // Create side-by-side comparison
    return sharp({
      create: {
        width: size * 2 + 20, // 20px gap
        height: size,
        channels: 3,
        background: '#f0f0f0'
      }
    })
    .composite([
      { input: original, left: 0, top: 0 },
      { input: processed, left: size + 20, top: 0 }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
  }

  /**
   * Clean up old processed images
   */
  async cleanupOldImages(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.processedDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.processedDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old images:', error);
    }
  }
}