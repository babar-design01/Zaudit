import { Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

/**
 * The database, when there is one.
 *
 * Without `DATABASE_URL` this module hands back `null` and the whole account
 * layer switches off: no sign-in, no credits, audits run for anyone who asks.
 * That is not a degraded mode to apologise for — it is the product as it was
 * before accounts existed, and it keeps a demo deployment working while the
 * database is still being set up.
 *
 * The WebSocket pool rather than the HTTP driver, because spending a credit has
 * to happen inside a transaction, and the HTTP driver has none.
 */

export type Db = NeonDatabase<typeof schema>;

let pool: Pool | null = null;
let instance: Db | null = null;

export function db(): Db | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!instance) {
    pool = new Pool({ connectionString: url });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

/** Whether accounts, credits and history are switched on at all. */
export function accountsEnabled(): boolean {
  return !!process.env.DATABASE_URL;
}

export { schema };
export * from './schema';
