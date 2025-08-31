import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessedImage {
  id: string;
  filename: string;
  originalFilename: string;
  width: number;
  height: number;
  size: number;
  format: string;
  url: string;
  thumbnailUrl?: string;
}

export interface ImageProcessingOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export class ImageProcessor {
  private uploadDir: string;
  private baseUrl: string;

  constructor(uploadDir: string = 'uploads', baseUrl: string = process.env.CDN_BASE_URL || '/uploads') {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;
  }

  async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async processImage(
    inputBuffer: Buffer,
    originalFilename: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      targetWidth = 768,
      targetHeight = 768,
      quality = 90,
      format = 'webp',
      generateThumbnail = false,
      thumbnailSize = 150,
    } = options;

    await this.ensureUploadDirectory();

    const id = uuidv4();
    const extension = format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png';
    const filename = `${id}.${extension}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      // Get original image metadata
      const metadata = await sharp(inputBuffer).metadata();
      
      // Process main image
      let sharpInstance = sharp(inputBuffer);

      // Resize while maintaining aspect ratio and fitting within target dimensions
      if (targetWidth && targetHeight) {
        sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      } else if (targetWidth) {
        sharpInstance = sharpInstance.resize(targetWidth, null, {
          withoutEnlargement: true,
        });
      } else if (targetHeight) {
        sharpInstance = sharpInstance.resize(null, targetHeight, {
          withoutEnlargement: true,
        });
      }

      // Convert format and apply quality
      switch (format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
      }

      // Save processed image
      const processedBuffer = await sharpInstance.toBuffer();
      await fs.writeFile(filepath, processedBuffer);

      // Get final dimensions
      const finalMetadata = await sharp(processedBuffer).metadata();
      const width = finalMetadata.width || targetWidth;
      const height = finalMetadata.height || targetHeight;

      const result: ProcessedImage = {
        id,
        filename,
        originalFilename,
        width,
        height,
        size: processedBuffer.length,
        format,
        url: `${this.baseUrl}/${filename}`,
      };

      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailFilename = `${id}_thumb.${extension}`;
        const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);

        const thumbnailBuffer = await sharp(processedBuffer)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center',
          })
          .toBuffer();

        await fs.writeFile(thumbnailPath, thumbnailBuffer);
        result.thumbnailUrl = `${this.baseUrl}/${thumbnailFilename}`;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processMultipleImages(
    files: Array<{ buffer: Buffer; originalname: string }>,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processImage(file.buffer, file.originalname, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${file.originalname}:`, error);
        // Continue processing other images
      }
    }

    return results;
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);

      // Also delete thumbnail if exists
      const extension = path.extname(filename);
      const basename = path.basename(filename, extension);
      const thumbnailFilename = `${basename}_thumb${extension}`;
      const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);
      
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async optimizeExistingImage(filepath: string, options: ImageProcessingOptions = {}): Promise<ProcessedImage> {
    try {
      const buffer = await fs.readFile(filepath);
      const originalFilename = path.basename(filepath);
      return await this.processImage(buffer, originalFilename, options);
    } catch (error) {
      throw new Error(`Failed to optimize existing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateImageBuffer(buffer: Buffer): boolean {
    try {
      // Check if it's a valid image by attempting to read metadata
      sharp(buffer).metadata();
      return true;
    } catch {
      return false;
    }
  }

  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return await sharp(buffer).metadata();
  }

  // Utility method for batch processing with progress
  async processBatchWithProgress(
    files: Array<{ buffer: Buffer; originalname: string }>,
    options: ImageProcessingOptions = {},
    onProgress?: (completed: number, total: number, currentFile: string) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress(i, total, file.originalname);
      }

      try {
        const result = await this.processImage(file.buffer, file.originalname, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${file.originalname}:`, error);
      }
    }

    if (onProgress) {
      onProgress(total, total, 'Complete');
    }

    return results;
  }

  // Generate different sizes for responsive images
  async generateResponsiveSizes(
    inputBuffer: Buffer,
    originalFilename: string,
    sizes: number[] = [256, 512, 768, 1024]
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (const size of sizes) {
      try {
        const result = await this.processImage(inputBuffer, originalFilename, {
          targetWidth: size,
          targetHeight: size,
          format: 'webp',
          quality: 90,
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate ${size}px version:`, error);
      }
    }

    return results;
  }
}

export default ImageProcessor;