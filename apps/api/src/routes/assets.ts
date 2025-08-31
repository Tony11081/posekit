import { Router } from 'express';
import { AssetController } from '../controllers/AssetController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no auth required for viewing)
router.get('/', AssetController.getAssets);
router.get('/:id', AssetController.getAsset);

// Protected routes (require authentication)
router.use(requireAuth);

// Upload routes
router.post('/upload', AssetController.uploadSingle);
router.post('/upload/multiple', AssetController.uploadMultiple);

// Admin-only routes
router.use(requireAdmin);
router.post('/batch-upload', AssetController.batchUpload);
router.post('/optimize', AssetController.optimizeAssets);
router.delete('/:id', AssetController.deleteAsset);

export default router;