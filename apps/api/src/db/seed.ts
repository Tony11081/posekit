import { db } from './connection';
import { 
  themes, 
  users, 
  assets, 
  poses, 
  poseVariants,
  userUtils 
} from '@/models';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

// Seed data
const seedThemes = [
  {
    name: 'Wedding',
    slug: 'wedding',
    description: 'Wedding photography poses for couples, ceremonies, and receptions',
    color: '#fdf2f8',
    icon: 'heart',
    featured: true,
    sortOrder: 1,
  },
  {
    name: 'Family',
    slug: 'family',
    description: 'Family portrait poses for groups of all sizes',
    color: '#fefce8',
    icon: 'users',
    featured: true,
    sortOrder: 2,
  },
  {
    name: 'Newborn',
    slug: 'newborn',
    description: 'Safe newborn photography poses (0-28 days)',
    color: '#f0f9ff',
    icon: 'baby',
    featured: true,
    sortOrder: 3,
  },
  {
    name: 'Maternity',
    slug: 'maternity',
    description: 'Maternity photography poses celebrating pregnancy',
    color: '#f0fdf4',
    icon: 'pregnant-woman',
    featured: true,
    sortOrder: 4,
  },
  {
    name: 'Couple',
    slug: 'couple',
    description: 'Romantic couple poses for engagement and portraits',
    color: '#faf5ff',
    icon: 'couple',
    featured: false,
    sortOrder: 5,
  },
  {
    name: 'Portrait',
    slug: 'portrait',
    description: 'Individual portrait poses for headshots and personal branding',
    color: '#fef7ff',
    icon: 'user-circle',
    featured: false,
    sortOrder: 6,
  },
];

const seedUsers = [
  {
    email: 'admin@posekit.com',
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'super_admin' as const,
    status: 'active' as const,
  },
  {
    email: 'editor@posekit.com',
    username: 'editor',
    firstName: 'Content',
    lastName: 'Editor',
    role: 'editor' as const,
    status: 'active' as const,
  },
  {
    email: 'viewer@posekit.com',
    username: 'viewer',
    firstName: 'Content',
    lastName: 'Viewer',
    role: 'viewer' as const,
    status: 'active' as const,
  },
];

const seedAssets = [
  {
    type: 'image' as const,
    title: 'Wedding Veil Lift',
    filename: 'wedding-veil-lift-85mm.webp',
    originalName: 'wedding_veil_lift.jpg',
    mimeType: 'image/webp',
    fileSize: 145000,
    width: 768,
    height: 960,
    aspectRatio: '4:5',
    storageKey: 'assets/poses/wedding-veil-lift-85mm.webp',
    url: 'https://cdn.posekit.com/assets/poses/wedding-veil-lift-85mm.webp',
    processingStatus: 'completed' as const,
    tags: ['wedding', 'veil', '85mm', 'standing'],
  },
  {
    type: 'image' as const,
    title: 'Newborn Tummy Time',
    filename: 'newborn-tummy-time-macro.webp',
    originalName: 'newborn_tummy_time.jpg',
    mimeType: 'image/webp',
    fileSize: 120000,
    width: 768,
    height: 768,
    aspectRatio: '1:1',
    storageKey: 'assets/poses/newborn-tummy-time-macro.webp',
    url: 'https://cdn.posekit.com/assets/poses/newborn-tummy-time-macro.webp',
    processingStatus: 'completed' as const,
    tags: ['newborn', 'tummy-time', 'macro', 'safety'],
  },
  {
    type: 'image' as const,
    title: 'Family Hand Holding',
    filename: 'family-hand-holding-50mm.webp',
    originalName: 'family_hand_holding.jpg',
    mimeType: 'image/webp',
    fileSize: 135000,
    width: 768,
    height: 1024,
    aspectRatio: '3:4',
    storageKey: 'assets/poses/family-hand-holding-50mm.webp',
    url: 'https://cdn.posekit.com/assets/poses/family-hand-holding-50mm.webp',
    processingStatus: 'completed' as const,
    tags: ['family', 'hands', '50mm', 'connection'],
  },
];

const seedPoses = [
  {
    slug: 'wedding-veil-lift-85mm',
    title: 'Wedding Veil Lift',
    description: 'Romantic wedding pose where the groom gently lifts the bride\'s veil while maintaining eye contact. Perfect for intimate moments during the ceremony or portrait sessions.',
    aliases: ['veil lift', 'wedding veil', 'bridal veil lift', 'groom lifting veil'],
    skeleton: 'adult-couple-standing',
    keypoints: {
      // Simplified keypoints for demo
      bride_head: { x: 200, y: 150, confidence: 0.95, visible: true },
      groom_head: { x: 400, y: 140, confidence: 0.95, visible: true },
      bride_shoulder_left: { x: 180, y: 220, confidence: 0.9, visible: true },
      bride_shoulder_right: { x: 220, y: 220, confidence: 0.9, visible: true },
      groom_shoulder_left: { x: 380, y: 210, confidence: 0.9, visible: true },
      groom_shoulder_right: { x: 420, y: 210, confidence: 0.9, visible: true },
      groom_hand_left: { x: 250, y: 180, confidence: 0.85, visible: true }, // Hand on veil
    },
    prompts: {
      sdxl: 'wedding portrait, bride and groom, veil lift, romantic, professional photography, 85mm lens, soft lighting, intimate moment',
      flux: 'elegant wedding scene with soft natural light, bride\'s veil being gently lifted, romantic and intimate pose',
    },
    safetyLevel: 'normal' as const,
    status: 'published' as const,
    featured: true,
    seoTitle: 'Wedding Veil Lift Pose - Romantic Bridal Photography',
    seoDescription: 'Professional wedding photography pose reference: romantic veil lift with proper positioning and lighting techniques.',
    seoKeywords: ['wedding photography', 'veil lift', 'bridal pose', 'romantic pose', '85mm lens'],
    viewCount: 1247,
    downloadCount: 89,
    favoriteCount: 156,
  },
  {
    slug: 'newborn-tummy-time-safe',
    title: 'Newborn Tummy Time (Safe)',
    description: 'Safe newborn photography pose with baby on tummy. Always ensure proper support and never leave baby unattended. Monitor breathing and comfort at all times.',
    aliases: ['tummy time', 'newborn prone', 'baby tummy time', 'newborn lying down'],
    skeleton: 'newborn-prone',
    keypoints: {
      head: { x: 384, y: 200, confidence: 0.9, visible: true },
      neck: { x: 384, y: 250, confidence: 0.8, visible: true },
      torso: { x: 384, y: 350, confidence: 0.9, visible: true },
      left_arm: { x: 320, y: 300, confidence: 0.7, visible: true },
      right_arm: { x: 448, y: 300, confidence: 0.7, visible: true },
    },
    prompts: {
      sdxl: 'newborn baby photography, tummy time pose, macro lens, soft natural light, peaceful sleeping baby',
      flux: 'gentle newborn portrait, baby lying on soft blanket, close-up macro photography, serene and peaceful',
    },
    safetyLevel: 'caution' as const,
    safetyNotes: 'SAFETY CRITICAL: Always have spotter present. Monitor breathing constantly. Maximum 30 seconds in position. Ensure baby comfort and warmth.',
    status: 'published' as const,
    featured: true,
    seoTitle: 'Safe Newborn Tummy Time Photography Pose',
    seoDescription: 'Safe newborn photography pose with complete safety guidelines and positioning tips for tummy time shots.',
    seoKeywords: ['newborn photography', 'tummy time', 'safe newborn poses', 'macro photography', 'baby photography'],
    viewCount: 856,
    downloadCount: 124,
    favoriteCount: 203,
  },
  {
    slug: 'family-hand-holding-connection',
    title: 'Family Hand Holding Connection',
    description: 'Beautiful family pose emphasizing connection through linked hands. Works well for families of 3-6 people. Creates a strong emotional bond in the image.',
    aliases: ['family hands', 'hand holding', 'family connection', 'linked hands'],
    skeleton: 'family-standing',
    keypoints: {
      parent1_head: { x: 200, y: 100, confidence: 0.95, visible: true },
      parent2_head: { x: 400, y: 110, confidence: 0.95, visible: true },
      child1_head: { x: 300, y: 200, confidence: 0.9, visible: true },
      parent1_hand: { x: 250, y: 300, confidence: 0.85, visible: true },
      parent2_hand: { x: 350, y: 300, confidence: 0.85, visible: true },
      child1_hand_left: { x: 270, y: 280, confidence: 0.8, visible: true },
      child1_hand_right: { x: 330, y: 280, confidence: 0.8, visible: true },
    },
    prompts: {
      sdxl: 'family portrait, hand holding, connection, 50mm lens, natural lighting, emotional bonding, group photography',
      flux: 'warm family portrait with emphasis on connected hands, natural outdoor lighting, emotional and heartwarming',
    },
    safetyLevel: 'normal' as const,
    status: 'published' as const,
    featured: false,
    seoTitle: 'Family Hand Holding Pose - Connection Photography',
    seoDescription: 'Family photography pose emphasizing emotional connection through hand holding. Perfect for creating meaningful family portraits.',
    seoKeywords: ['family photography', 'hand holding', 'family connection', 'group pose', '50mm lens'],
    viewCount: 2134,
    downloadCount: 167,
    favoriteCount: 298,
  },
];

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create admin user first (needed as foreign key for other records)
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    logger.info('Creating users...');
    const insertedUsers = await db.insert(users).values(
      seedUsers.map(user => ({
        ...user,
        passwordHash: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }))
    ).returning();

    const adminUser = insertedUsers.find(u => u.role === 'super_admin')!;
    logger.info(`Created admin user: ${adminUser.email}`);

    // Create themes
    logger.info('Creating themes...');
    const insertedThemes = await db.insert(themes).values(seedThemes).returning();
    logger.info(`Created ${insertedThemes.length} themes`);

    // Create assets
    logger.info('Creating assets...');
    const insertedAssets = await db.insert(assets).values(
      seedAssets.map(asset => ({
        ...asset,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }))
    ).returning();
    logger.info(`Created ${insertedAssets.length} assets`);

    // Create poses
    logger.info('Creating poses...');
    const insertedPoses = await db.insert(poses).values(
      seedPoses.map((pose, index) => ({
        ...pose,
        themeId: insertedThemes[index % insertedThemes.length].id, // Distribute across themes
        previewAssetId: insertedAssets[index].id,
        tagIds: [], // Will be populated when we create tags
        publishedAt: new Date(),
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }))
    ).returning();
    logger.info(`Created ${insertedPoses.length} poses`);

    // Create pose variants (mirror variants for demonstration)
    logger.info('Creating pose variants...');
    const variantData = insertedPoses.map((pose, index) => ({
      poseId: pose.id,
      type: 'mirror' as const,
      title: `${pose.title} (Mirrored)`,
      description: `Mirrored version of ${pose.title}`,
      assetId: insertedAssets[index].id, // Reuse same asset for demo
      prompts: pose.prompts,
      sortOrder: 1,
    }));

    const insertedVariants = await db.insert(poseVariants).values(variantData).returning();
    logger.info(`Created ${insertedVariants.length} pose variants`);

    // Update theme pose counts
    logger.info('Updating theme pose counts...');
    for (const theme of insertedThemes) {
      const poseCount = insertedPoses.filter(p => p.themeId === theme.id).length;
      await db.update(themes)
        .set({ poseCount })
        .where({ id: theme.id });
    }

    logger.info('Database seeding completed successfully!');
    logger.info('🔐 Default admin credentials:');
    logger.info(`   Email: ${adminUser.email}`);
    logger.info(`   Password: ${defaultPassword}`);
    logger.info('📊 Created records:');
    logger.info(`   Users: ${insertedUsers.length}`);
    logger.info(`   Themes: ${insertedThemes.length}`);
    logger.info(`   Assets: ${insertedAssets.length}`);
    logger.info(`   Poses: ${insertedPoses.length}`);
    logger.info(`   Variants: ${insertedVariants.length}`);

  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;