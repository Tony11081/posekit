import { z } from 'zod';

// Database configuration schema
const databaseConfigSchema = z.object({
  url: z.string().url('Invalid database URL'),
  pool: z.object({
    max: z.number().int().min(1).max(50).default(20),
    min: z.number().int().min(0).max(10).default(2),
    idleTimeout: z.number().int().min(1000).default(30000),
    connectTimeout: z.number().int().min(1000).default(10000),
  }),
  logging: z.boolean().default(false),
  migrations: z.object({
    directory: z.string().default('./src/db/migrations'),
    table: z.string().default('drizzle_migrations'),
  }),
});

// Environment-based configuration
export const config = databaseConfigSchema.parse({
  url: process.env.DATABASE_URL || 'postgresql://posekit_user:password@localhost:5432/posekit',
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 20,
    min: Number(process.env.DB_POOL_MIN) || 2,
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,
  },
  logging: process.env.DEBUG_SQL === 'true',
  migrations: {
    directory: process.env.DB_MIGRATIONS_DIR || './src/db/migrations',
    table: process.env.DB_MIGRATIONS_TABLE || 'drizzle_migrations',
  },
});

// Export individual config sections
export const { url, pool, logging, migrations } = config;

export default config;