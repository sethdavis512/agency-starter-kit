import { isLocalDatabase } from "@repo/database/database-url";

export interface SeedGateInput {
  /** `--seed` was passed on the command line. */
  seedFlag: boolean;
  databaseUrl: string | undefined;
  seedPassword: string | undefined;
}

export type SeedDecision =
  | { action: "seed"; reason: string }
  | { action: "skip"; reason: string }
  | { action: "refuse"; reason: string };

/**
 * Decide whether `db:setup` should run the demo seed.
 *
 * - Local DATABASE_URL: always seed (dev convenience, fixed dev password).
 * - Non-local without `--seed`: skip — never seed a shared DB by accident.
 * - Non-local with `--seed` but no SEED_PASSWORD: refuse — the seed script
 *   would fail anyway, so fail early with a clear message.
 * - Non-local with `--seed` and SEED_PASSWORD: seed.
 */
export function decideSeed({
  seedFlag,
  databaseUrl,
  seedPassword,
}: SeedGateInput): SeedDecision {
  if (isLocalDatabase(databaseUrl)) {
    return { action: "seed", reason: "DATABASE_URL is local" };
  }

  if (!seedFlag) {
    return {
      action: "skip",
      reason:
        "DATABASE_URL is not local; pass --seed (and set SEED_PASSWORD) to seed demo users",
    };
  }

  if (!seedPassword) {
    return {
      action: "refuse",
      reason:
        "Refusing to seed a non-local DATABASE_URL without SEED_PASSWORD. Set it to a strong value before running with --seed.",
    };
  }

  return { action: "seed", reason: "--seed passed and SEED_PASSWORD is set" };
}
