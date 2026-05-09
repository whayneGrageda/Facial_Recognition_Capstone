import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class Database {
  private pool: pg.Pool;
  private static instance: Database;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'facial_recognition',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('⚠️ Unexpected error on idle client (pool will recover):', err.message);
      // Don't exit — the pool handles reconnections automatically.
      // Only fatal errors (e.g., auth failure) would need a restart.
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connection established');
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async query(text: string, params?: any[]): Promise<pg.QueryResult> {
    try {
      const res = await this.pool.query(text, params);
      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  public async getClient(): Promise<pg.PoolClient> {
    return await this.pool.connect();
  }

  public getPool(): pg.Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

const db = Database.getInstance();

export const query = (text: string, params?: any[]) => db.query(text, params);
export const getClient = () => db.getClient();
export const getPool = () => db.getPool();

export default db;
