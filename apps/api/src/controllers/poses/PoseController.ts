import { Request, Response, NextFunction } from 'express';
import { eq, and, desc, asc, count, like, ilike, inArray } from 'drizzle-orm';
import { db } from '@/db/connection';
import { 
  poses, 
  themes, 
  assets, 
  users,
  poseVariants,
  type PoseInsert, 
  type PoseUpdate, 
  type PoseFilters,
  poseUtils,
  dbUtils 
} from '@/models';
import { logger, logUtils } from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import type { AuthRequest } from '@/types/auth';

export class PoseController {
  
  // List poses with filtering and pagination
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as PoseFilters;
      const { page, limit } = dbUtils.validatePagination(
        Number(filters.offset) / Number(filters.limit) + 1 || 1,
        Number(filters.limit) || 20
      );
      const offset = dbUtils.getOffset(page, limit);

      // Build query conditions
      const conditions = [
        eq(poses.status, 'published') // Only published poses for public API
      ];

      if (filters.themeId) {
        conditions.push(eq(poses.themeId, filters.themeId));
      }

      if (filters.featured !== undefined) {
        conditions.push(eq(poses.featured, filters.featured));
      }

      if (filters.safetyLevel) {
        conditions.push(eq(poses.safetyLevel, filters.safetyLevel));
      }

      if (filters.search) {
        // Simple text search - full-text search handled by SearchController
        conditions.push(
          ilike(poses.title, `%${filters.search}%`)
        );
      }

      // Execute count query
      const [totalResult] = await db
        .select({ count: count() })
        .from(poses)
        .where(and(...conditions));

      const total = totalResult.count;

      // Build sort order
      const sortColumn = filters.sortBy === 'title' ? poses.title :
                        filters.sortBy === 'viewCount' ? poses.viewCount :
                        filters.sortBy === 'favoriteCount' ? poses.favoriteCount :
                        poses.createdAt;

      const sortOrder = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

      // Execute main query with joins
      const result = await db
        .select({
          pose: poses,
          theme: themes,
          previewAsset: assets,
        })
        .from(poses)
        .leftJoin(themes, eq(poses.themeId, themes.id))
        .leftJoin(assets, eq(poses.previewAssetId, assets.id))
        .where(and(...conditions))
        .orderBy(sortOrder)
        .limit(limit)
        .offset(offset);

      // Transform result
      const posesData = result.map(row => ({
        ...row.pose,
        theme: row.theme,
        previewAsset: row.previewAsset,
        previewUrl: row.previewAsset ? (row.previewAsset.cdnUrl || row.previewAsset.url) : null,
        detailUrl: poseUtils.getPreviewUrl(row.pose),
      }));

      const pagination = dbUtils.buildPagination(total, page, limit);

      res.json({
        success: true,
        data: posesData,
        pagination,
        message: `Found ${total} poses`,
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.list');
      next(error);
    }
  }

  // Get pose by slug
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const result = await db
        .select({
          pose: poses,
          theme: themes,
          previewAsset: assets,
          createdByUser: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(poses)
        .leftJoin(themes, eq(poses.themeId, themes.id))
        .leftJoin(assets, eq(poses.previewAssetId, assets.id))
        .leftJoin(users, eq(poses.createdBy, users.id))
        .where(and(
          eq(poses.slug, slug),
          eq(poses.status, 'published')
        ))
        .limit(1);

      if (result.length === 0) {
        throw new ApiError('Pose not found', 404);
      }

      const poseData = result[0];

      // Get variants
      const variants = await db
        .select({
          variant: poseVariants,
          asset: assets,
        })
        .from(poseVariants)
        .leftJoin(assets, eq(poseVariants.assetId, assets.id))
        .where(eq(poseVariants.poseId, poseData.pose.id))
        .orderBy(asc(poseVariants.sortOrder));

      // Build complete pose object
      const completeData = {
        ...poseData.pose,
        theme: poseData.theme,
        previewAsset: poseData.previewAsset,
        previewUrl: poseData.previewAsset ? (poseData.previewAsset.cdnUrl || poseData.previewAsset.url) : null,
        createdByUser: poseData.createdByUser,
        variants: variants.map(v => ({
          ...v.variant,
          asset: v.asset,
          assetUrl: v.asset ? (v.asset.cdnUrl || v.asset.url) : null,
        })),
        seo: poseUtils.buildSEOMetadata(poseData.pose),
      };

      res.json({
        success: true,
        data: completeData,
        message: 'Pose retrieved successfully',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.getBySlug');
      next(error);
    }
  }

  // Create new pose
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const poseData: PoseInsert = req.body;
      const userId = req.user!.id;

      // Generate slug if not provided
      if (!poseData.slug) {
        poseData.slug = poseUtils.generateSlug(poseData.title);
      }

      // Check slug uniqueness
      const existingPose = await db
        .select({ id: poses.id })
        .from(poses)
        .where(eq(poses.slug, poseData.slug))
        .limit(1);

      if (existingPose.length > 0) {
        throw new ApiError('Pose with this slug already exists', 400);
      }

      // Create pose
      const [newPose] = await db
        .insert(poses)
        .values({
          ...poseData,
          createdBy: userId,
          updatedBy: userId,
          publishedAt: poseData.status === 'published' ? new Date() : undefined,
        })
        .returning();

      logUtils.logUserAction(userId, 'create', 'pose', newPose.id, { title: newPose.title });

      res.status(201).json({
        success: true,
        data: newPose,
        message: 'Pose created successfully',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.create');
      next(error);
    }
  }

  // Update pose
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData: PoseUpdate = req.body;
      const userId = req.user!.id;

      // Check if pose exists
      const [existingPose] = await db
        .select()
        .from(poses)
        .where(eq(poses.id, id))
        .limit(1);

      if (!existingPose) {
        throw new ApiError('Pose not found', 404);
      }

      // If slug is being updated, check uniqueness
      if (updateData.slug && updateData.slug !== existingPose.slug) {
        const slugExists = await db
          .select({ id: poses.id })
          .from(poses)
          .where(and(
            eq(poses.slug, updateData.slug),
            ne(poses.id, id)
          ))
          .limit(1);

        if (slugExists.length > 0) {
          throw new ApiError('Pose with this slug already exists', 400);
        }
      }

      // Update pose
      const [updatedPose] = await db
        .update(poses)
        .set({
          ...updateData,
          updatedBy: userId,
          publishedAt: updateData.status === 'published' && existingPose.status !== 'published' 
            ? new Date() 
            : existingPose.publishedAt,
        })
        .where(eq(poses.id, id))
        .returning();

      logUtils.logUserAction(userId, 'update', 'pose', id, { 
        title: updatedPose.title,
        changes: Object.keys(updateData) 
      });

      res.json({
        success: true,
        data: updatedPose,
        message: 'Pose updated successfully',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.update');
      next(error);
    }
  }

  // Update pose status
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      const [updatedPose] = await db
        .update(poses)
        .set({
          status,
          updatedBy: userId,
          publishedAt: status === 'published' ? new Date() : undefined,
        })
        .where(eq(poses.id, id))
        .returning();

      if (!updatedPose) {
        throw new ApiError('Pose not found', 404);
      }

      logUtils.logUserAction(userId, 'update_status', 'pose', id, { 
        oldStatus: updatedPose.status,
        newStatus: status 
      });

      res.json({
        success: true,
        data: updatedPose,
        message: `Pose status updated to ${status}`,
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.updateStatus');
      next(error);
    }
  }

  // Delete pose
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const [deletedPose] = await db
        .delete(poses)
        .where(eq(poses.id, id))
        .returning({ id: poses.id, title: poses.title });

      if (!deletedPose) {
        throw new ApiError('Pose not found', 404);
      }

      logUtils.logUserAction(userId, 'delete', 'pose', id, { title: deletedPose.title });

      res.json({
        success: true,
        message: 'Pose deleted successfully',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.delete');
      next(error);
    }
  }

  // Bulk actions
  async bulkAction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action, poseIds, options = {} } = req.body;
      const userId = req.user!.id;

      let result;
      switch (action) {
        case 'delete':
          result = await db
            .delete(poses)
            .where(inArray(poses.id, poseIds))
            .returning({ id: poses.id, title: poses.title });
          break;

        case 'publish':
          result = await db
            .update(poses)
            .set({ 
              status: 'published',
              publishedAt: new Date(),
              updatedBy: userId,
            })
            .where(inArray(poses.id, poseIds))
            .returning({ id: poses.id, title: poses.title });
          break;

        case 'archive':
          result = await db
            .update(poses)
            .set({ 
              status: 'archived',
              updatedBy: userId,
            })
            .where(inArray(poses.id, poseIds))
            .returning({ id: poses.id, title: poses.title });
          break;

        default:
          throw new ApiError('Invalid bulk action', 400);
      }

      logUtils.logUserAction(userId, `bulk_${action}`, 'pose', undefined, { 
        poseIds,
        count: result.length,
        options 
      });

      res.json({
        success: true,
        data: { affectedCount: result.length, poses: result },
        message: `Bulk ${action} completed on ${result.length} poses`,
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.bulkAction');
      next(error);
    }
  }

  // Increment view count
  async incrementViewCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Use UPDATE ... RETURNING for atomic increment
      const [updatedPose] = await db
        .update(poses)
        .set({
          viewCount: sql`${poses.viewCount} + 1`,
        })
        .where(eq(poses.id, id))
        .returning({ id: poses.id, viewCount: poses.viewCount });

      if (!updatedPose) {
        throw new ApiError('Pose not found', 404);
      }

      res.json({
        success: true,
        data: { viewCount: updatedPose.viewCount },
        message: 'View count updated',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.incrementViewCount');
      next(error);
    }
  }

  // Get pose analytics
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [poseData] = await db
        .select({
          id: poses.id,
          title: poses.title,
          viewCount: poses.viewCount,
          downloadCount: poses.downloadCount,
          favoriteCount: poses.favoriteCount,
          createdAt: poses.createdAt,
          publishedAt: poses.publishedAt,
        })
        .from(poses)
        .where(eq(poses.id, id))
        .limit(1);

      if (!poseData) {
        throw new ApiError('Pose not found', 404);
      }

      // Get variants count
      const [variantsResult] = await db
        .select({ count: count() })
        .from(poseVariants)
        .where(eq(poseVariants.poseId, id));

      const analytics = {
        ...poseData,
        variantsCount: variantsResult.count,
        avgViewsPerDay: poseData.publishedAt ? 
          Math.round(poseData.viewCount / Math.max(1, 
            (Date.now() - poseData.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
          )) : 0,
      };

      res.json({
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully',
      });

    } catch (error) {
      logUtils.logError(error as Error, 'PoseController.getAnalytics');
      next(error);
    }
  }
}

// Missing import fix
import { ne, sql } from 'drizzle-orm';