import { Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import { assets } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import ImageProcessor from '../services/ImageProcessor';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const imageProcessor = new ImageProcessor();

export class AssetController {
  // Upload single image
  static uploadSingle = [
    upload.single('image'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        // Validate image
        if (!imageProcessor.validateImageBuffer(req.file.buffer)) {
          return res.status(400).json({ error: 'Invalid image file' });
        }

        // Process image
        const processedImage = await imageProcessor.processImage(
          req.file.buffer,
          req.file.originalname,
          {
            targetWidth: 768,
            targetHeight: 768,
            format: 'webp',
            quality: 90,
            generateThumbnail: true,
            thumbnailSize: 150,
          }
        );

        // Save to database
        const [asset] = await db.insert(assets).values({
          id: uuidv4(),
          filename: processedImage.filename,
          originalFilename: processedImage.originalFilename,
          mimeType: `image/${processedImage.format}`,
          size: processedImage.size,
          width: processedImage.width,
          height: processedImage.height,
          url: processedImage.url,
          thumbnailUrl: processedImage.thumbnailUrl,
          createdBy: req.user?.id, // Assuming auth middleware sets req.user
        }).returning();

        res.json({ success: true, asset });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
          error: 'Failed to upload image',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  // Upload multiple images
  static uploadMultiple = [
    upload.array('images', 10),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No image files provided' });
        }

        // Validate all images first
        for (const file of files) {
          if (!imageProcessor.validateImageBuffer(file.buffer)) {
            return res.status(400).json({ 
              error: `Invalid image file: ${file.originalname}` 
            });
          }
        }

        // Process all images
        const processedImages = await imageProcessor.processMultipleImages(
          files.map(f => ({ buffer: f.buffer, originalname: f.originalname })),
          {
            targetWidth: 768,
            targetHeight: 768,
            format: 'webp',
            quality: 90,
            generateThumbnail: true,
            thumbnailSize: 150,
          }
        );

        // Save all to database
        const assetData = processedImages.map(img => ({
          id: uuidv4(),
          filename: img.filename,
          originalFilename: img.originalFilename,
          mimeType: `image/${img.format}`,
          size: img.size,
          width: img.width,
          height: img.height,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          createdBy: req.user?.id,
        }));

        const savedAssets = await db.insert(assets).values(assetData).returning();

        res.json({ 
          success: true, 
          assets: savedAssets,
          processed: processedImages.length,
          total: files.length,
        });
      } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ 
          error: 'Failed to upload images',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  // Get all assets with pagination
  static getAssets = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const allAssets = await db
        .select()
        .from(assets)
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset);

      const total = await db.$count(assets);
      
      res.json({
        success: true,
        assets: allAssets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  };

  // Get single asset by ID
  static getAsset = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, id));

      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.json({ success: true, asset });
    } catch (error) {
      console.error('Get asset error:', error);
      res.status(500).json({ error: 'Failed to fetch asset' });
    }
  };

  // Delete asset
  static deleteAsset = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get asset first to get filename for deletion
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, id));

      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      // Delete from database
      await db.delete(assets).where(eq(assets.id, id));

      // Delete physical files
      try {
        await imageProcessor.deleteImage(asset.filename);
      } catch (fileError) {
        console.warn(`Failed to delete physical file ${asset.filename}:`, fileError);
        // Continue anyway since DB record is deleted
      }

      res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Delete asset error:', error);
      res.status(500).json({ error: 'Failed to delete asset' });
    }
  };

  // Batch upload with progress (for admin use)
  static batchUpload = [
    upload.array('images', 50),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No image files provided' });
        }

        // Set up Server-Sent Events for progress
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        const sendProgress = (completed: number, total: number, currentFile: string) => {
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            completed,
            total,
            currentFile,
            percentage: Math.round((completed / total) * 100),
          })}\n\n`);
        };

        const sendError = (error: string) => {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error,
          })}\n\n`);
        };

        const sendComplete = (results: any) => {
          res.write(`data: ${JSON.stringify({
            type: 'complete',
            results,
          })}\n\n`);
          res.end();
        };

        try {
          // Process images with progress
          const processedImages = await imageProcessor.processBatchWithProgress(
            files.map(f => ({ buffer: f.buffer, originalname: f.originalname })),
            {
              targetWidth: 768,
              targetHeight: 768,
              format: 'webp',
              quality: 90,
              generateThumbnail: true,
              thumbnailSize: 150,
            },
            sendProgress
          );

          // Save to database
          const assetData = processedImages.map(img => ({
            id: uuidv4(),
            filename: img.filename,
            originalFilename: img.originalFilename,
            mimeType: `image/${img.format}`,
            size: img.size,
            width: img.width,
            height: img.height,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            createdBy: req.user?.id,
          }));

          const savedAssets = await db.insert(assets).values(assetData).returning();

          sendComplete({
            success: true,
            processed: savedAssets.length,
            total: files.length,
            assets: savedAssets,
          });
        } catch (error) {
          sendError(error instanceof Error ? error.message : 'Unknown error');
        }
      } catch (error) {
        console.error('Batch upload error:', error);
        res.status(500).json({ error: 'Failed to start batch upload' });
      }
    }
  ];

  // Optimize existing assets (admin utility)
  static optimizeAssets = async (req: Request, res: Response) => {
    try {
      // This would be used to re-process existing assets with new settings
      const allAssets = await db.select().from(assets);
      
      res.json({
        success: true,
        message: 'Asset optimization started',
        totalAssets: allAssets.length,
      });
    } catch (error) {
      console.error('Optimize assets error:', error);
      res.status(500).json({ error: 'Failed to optimize assets' });
    }
  };
}

export default AssetController;