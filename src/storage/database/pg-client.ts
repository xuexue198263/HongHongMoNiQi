import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL is not set, database features will be disabled');
    throw new Error('DATABASE_URL is not configured');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });

  return pool;
}

export function getDb() {
  if (db) {
    return db;
  }

  try {
    const pool = getPool();
    db = drizzle(pool, { schema });
    return db;
  } catch {
    console.warn('Failed to initialize database connection, database features will be disabled');
    return null;
  }
}

export * from './shared/schema';