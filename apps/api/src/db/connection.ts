import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '@/config/database';
import { logger } from '@/utils/logger';

// Create postgres connection
const sql = postgres(config.url, {
  max: config.pool.max,
  idle_timeout: config.pool.idleTimeout,
  connect_timeout: config.pool.connectTimeout,
  prepare: false, // Disable prepared statements for better compatibility
  onnotice: config.logging ? logger.info : undefined,
});

// Create Drizzle instance
export const db = drizzle(sql, {
  logger: config.logging,
});

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as health`;
    return result.length > 0 && result[0]?.health === 1;
  } catch (error) {
    logger.error('Database connection check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await sql.end({ timeout: 5 });
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

// Connection pool monitoring
export function getDatabaseStats() {
  return {
    // @ts-ignore - postgres-js internal properties
    totalConnections: sql.options.max,
    // @ts-ignore
    activeConnections: sql.reserved,
    // @ts-ignore
    idleConnections: sql.ended.length,
  };
}

export default db;