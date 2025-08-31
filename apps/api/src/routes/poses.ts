import { Router } from 'express';
import { PoseController } from '@/controllers/poses/PoseController';
import { SearchController } from '@/controllers/poses/SearchController';
import { VariantController } from '@/controllers/poses/VariantController';
import { auth, requirePermission } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { poseFiltersSchema, insertPoseSchema, updatePoseSchema } from '@/models';

const router = Router();
const poseController = new PoseController();
const searchController = new SearchController();
const variantController = new VariantController();

// Public routes (no authentication required)
router.get('/', validateRequest({ query: poseFiltersSchema }), poseController.list);
router.get('/search', validateRequest({ query: poseFiltersSchema }), searchController.searchPoses);
router.get('/:slug', poseController.getBySlug);
router.get('/:id/variants', variantController.listByPoseId);

// Increment view count (public)
router.post('/:id/view', poseController.incrementViewCount);

// Protected routes (authentication required)
router.use(auth); // All routes below require authentication

// Editor permissions required
router.post('/', 
  requirePermission('poses:create'),
  validateRequest({ body: insertPoseSchema }),
  poseController.create
);

router.put('/:id', 
  requirePermission('poses:update'),
  validateRequest({ body: updatePoseSchema }),
  poseController.update
);

router.patch('/:id/status', 
  requirePermission('poses:publish'),
  validateRequest({ 
    body: z.object({ status: z.enum(['draft', 'review', 'published', 'archived']) })
  }),
  poseController.updateStatus
);

// Super admin permissions required
router.delete('/:id', 
  requirePermission('poses:delete'),
  poseController.delete
);

router.post('/bulk', 
  requirePermission('poses:bulk-edit'),
  validateRequest({
    body: z.object({
      action: z.enum(['delete', 'publish', 'archive', 'update-tags']),
      poseIds: z.array(z.string().uuid()),
      options: z.record(z.any()).optional(),
    })
  }),
  poseController.bulkAction
);

// Pose variants management
router.post('/:id/variants',
  requirePermission('poses:update'),
  validateRequest({ body: insertPoseVariantSchema }),
  variantController.create
);

router.put('/:poseId/variants/:variantId',
  requirePermission('poses:update'),
  validateRequest({ body: updatePoseVariantSchema }),
  variantController.update
);

router.delete('/:poseId/variants/:variantId',
  requirePermission('poses:update'),
  variantController.delete
);

// Analytics endpoints
router.get('/:id/analytics', 
  requirePermission('system:analytics'),
  poseController.getAnalytics
);

export default router;