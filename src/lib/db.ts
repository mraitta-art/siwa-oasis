import mysql from 'mysql2/promise';

type DbMode = 'local' | 'production';

let pool: mysql.Pool | null = null;
let poolInitPromise: Promise<mysql.Pool> | null = null;
let activeMode: DbMode | null = null;

function buildPoolConfig(mode: DbMode) {
  if (mode === 'production') {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      throw new Error('Missing required DB environment variables: DB_HOST, DB_USER, DB_NAME');
    }

    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    };
  }

  const dbConfig: any = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  };

  if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    };
  }

  return dbConfig;
}

function isRetryableDbError(err: any) {
  return [
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'ER_BAD_DB_ERROR',
    'ER_ACCESS_DENIED_ERROR',
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_UNKNOWN_TABLE',
    'ER_NO_SUCH_TABLE'
  ].includes(err?.code);
}

async function initializePool(): Promise<mysql.Pool> {
  if (pool && activeMode) {
    return pool;
  }

  if (poolInitPromise) {
    return poolInitPromise;
  }

  poolInitPromise = (async () => {
    if (process.env.NODE_ENV === 'production') {
      pool = mysql.createPool(buildPoolConfig('production'));
      activeMode = 'production';
      return pool;
    }

    const localPool = mysql.createPool(buildPoolConfig('local'));
    try {
      await localPool.query('SELECT 1');
      pool = localPool;
      activeMode = 'local';
      console.log('[DB] Using local database.');
      return pool;
    } catch (err: any) {
      const message = err?.message || String(err);
      console.warn('[DB] Local database unavailable, falling back to the production database.', message);
      const productionPool = mysql.createPool(buildPoolConfig('production'));
      pool = productionPool;
      activeMode = 'production';
      return pool;
    }
  })();

  return poolInitPromise;
}

async function executeWithPool<T>(fn: (activePool: mysql.Pool) => Promise<T>): Promise<T> {
  const activePool = await initializePool();

  try {
    return await fn(activePool);
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production' && isRetryableDbError(err) && activeMode !== 'production') {
      console.warn('[DB] Retrying with the production database after a connection error.', err?.message || err);
      const productionPool = mysql.createPool(buildPoolConfig('production'));
      pool = productionPool;
      activeMode = 'production';
      return fn(productionPool);
    }

    throw err;
  }
}

// Export the raw pool only as a named export if needed; default export will be the guarded helper below.
// (This avoids existing files importing the raw pool and bypassing the safe wrappers.)

/** Named alias so legacy imports like `import { db } from '@/lib/db'` resolve correctly */
export const db = {
  query: async (sql: string, params?: unknown[]) => {
    try {
      const [rows] = await executeWithPool(async (activePool) => {
        return activePool.query(sql, params as never);
      });
      return [rows] as [unknown[]];
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('DB query error (dev mode) — returning empty result:', err && err.sqlMessage ? err.sqlMessage : err);
        if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR')) {
          return [[]] as [unknown[]];
        }
      }
      throw err;
    }
  },
  execute: async (sql: string, params?: unknown[]) => {
    try {
      const [result] = await executeWithPool(async (activePool) => {
        return activePool.query(sql, params as never);
      });
      return [result];
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('DB execute error (dev mode):', err && err.sqlMessage ? err.sqlMessage : err);
      }
      throw err;
    }
  },
};

/** Execute a query and return rows */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await executeWithPool(async (activePool) => {
      return activePool.query(sql, params as never);
    });
    return rows as T[];
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production' && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR')) {
      console.warn('query() returning empty array due to missing table/column in dev:', err.sqlMessage);
      return [] as T[];
    }
    throw err;
  }
}

/** Execute a query and return the first row */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Execute an INSERT/UPDATE/DELETE and return result info */
export async function execute(sql: string, params?: any[]) {
  try {
    const [result] = await executeWithPool(async (activePool) => {
      return activePool.query(sql, params as never);
    });
    return result as mysql.ResultSetHeader;
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('execute() failed in dev:', err && err.sqlMessage ? err.sqlMessage : err);
    }
    throw err;
  }
}

// Default export — the guarded helper. Keeps existing imports like `import db from '@/lib/db'` working.
export default db;

/** Transaction helper — run multiple queries atomically */
export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const activePool = await initializePool();
  const conn = await activePool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Consolidates legacy custom_data section keys into new core keys */
export function normalizeCustomData(rawCustomData: any): any {
  if (!rawCustomData) return {};
  let c: any = {};
  try {
    c = typeof rawCustomData === 'string' ? JSON.parse(rawCustomData) : rawCustomData;
  } catch (e) {
    c = {};
  }
  
  const basic = {
    ...(c.business_info || {}),
    ...(c.sec_1_identity || {}),
    ...(c.about || {}),
    ...(c.basic || {})
  };
  
  const vibe = {
    ...(c.sec_3_services || {}),
    ...(c.vibe || {})
  };
  
  const experience = {
    ...(c.services || {}),
    ...(c.experience || {})
  };
  
  const offers = {
    ...(c.discount || {}),
    ...(c.package || {}),
    ...(c['offers-promotions'] || {}),
    ...(c['discounts-promotions'] || {}),
    ...(c['offers-packages'] || {}),
    ...(c.offers || {})
  };

  return {
    ...c,
    basic,
    vibe,
    experience,
    offers,
  };
}
