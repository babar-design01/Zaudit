import type { Config } from 'drizzle-kit';

/**
 * `npm run db:push` reads this and makes the database match `schema.ts`.
 *
 * Push rather than migrations: there is one deployment and the schema is young.
 * The day a second environment exists, swap this for generated migrations so a
 * column rename cannot quietly drop data.
 */
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
} satisfies Config;
