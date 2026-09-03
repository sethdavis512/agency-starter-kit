const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * True when DATABASE_URL points at a database on this machine.
 *
 * Shared by the seed script (which only falls back to the fixed dev password
 * for local databases) and by `cli db:setup` (which only seeds automatically
 * when the target is local). Unset or unparseable URLs are treated as
 * non-local so the safe path always wins.
 */
export function isLocalDatabase(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return false;
  try {
    return LOCAL_DB_HOSTS.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}
