import mysql from 'mysql2/promise';

let pool: mysql.Pool;

if (process.env.NODE_ENV === 'production') {
  // PRODUCTION: Require all DB vars to be set
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Missing required DB environment variables: DB_HOST, DB_USER, DB_NAME');
  }
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: true
    } : undefined
  });
} else {
  // In development, use a global variable so that the pool is not recreated on every HMR
  if (!(global as any).dbPool) {
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
        rejectUnauthorized: true
      };
    }

    console.log('[DB] Initializing dev pool with:', JSON.stringify({ ...dbConfig, password: '***' }));
    (global as any).dbPool = mysql.createPool(dbConfig);
  }
  pool = (global as any).dbPool;
}

export default pool;

/** Execute a query and return rows */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Execute a query and return the first row */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Execute an INSERT/UPDATE/DELETE and return result info */
export async function execute(sql: string, params?: any[]) {
  const [result] = await pool.query(sql, params);
  return result as mysql.ResultSetHeader;
}

/** Transaction helper — run multiple queries atomically */
export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
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
