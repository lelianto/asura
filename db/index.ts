// Platform-neutral database seam.
//
// The site does not need a database yet, so nothing here imports a driver or a
// runtime-specific binding. That is deliberate: a static `cloudflare:workers`
// import cannot be resolved by the Next.js build, so keeping this module free
// of one is what lets the project deploy to Vercel and Netlify while the
// database is still being provisioned.
//
// When a Postgres (Neon) database is ready: set `DATABASE_URL`, install a
// driver, and build the client inside `getDb()`.
// The Cloudflare D1 variant lives in `examples/d1/db/client.ts`.

const DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
] as const;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      `No database is configured. Set one of ${DATABASE_URL_KEYS.join(", ")} and wire a driver in db/index.ts before calling getDb().`
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/** The configured connection string, or `null` while the database is unset. */
export function getDatabaseUrl(): string | null {
  for (const key of DATABASE_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return null;
}

/**
 * Guard for callers that must degrade gracefully instead of failing the
 * request when the database has not been provisioned yet.
 */
export function isDatabaseReady(): boolean {
  return getDatabaseUrl() !== null;
}

export function getDb(): never {
  throw new DatabaseNotConfiguredError();
}
