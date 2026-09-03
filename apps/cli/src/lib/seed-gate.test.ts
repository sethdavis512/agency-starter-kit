import { describe, expect, it } from "vitest";
import { decideSeed } from "./seed-gate";

const LOCAL_URL =
  "postgresql://postgres:postgres@localhost:5432/agency_starter";
const REMOTE_URL = "postgresql://user:pass@db.railway.internal:5432/railway";

describe("decideSeed", () => {
  it("seeds a local database without --seed", () => {
    expect(
      decideSeed({
        seedFlag: false,
        databaseUrl: LOCAL_URL,
        seedPassword: undefined,
      }).action,
    ).toBe("seed");
  });

  it("seeds a local database with --seed", () => {
    expect(
      decideSeed({
        seedFlag: true,
        databaseUrl: LOCAL_URL,
        seedPassword: undefined,
      }).action,
    ).toBe("seed");
  });

  it("skips a non-local database when --seed is not passed", () => {
    expect(
      decideSeed({
        seedFlag: false,
        databaseUrl: REMOTE_URL,
        seedPassword: "strong-password",
      }).action,
    ).toBe("skip");
  });

  it("refuses a non-local database with --seed but no SEED_PASSWORD", () => {
    expect(
      decideSeed({
        seedFlag: true,
        databaseUrl: REMOTE_URL,
        seedPassword: undefined,
      }).action,
    ).toBe("refuse");
  });

  it("refuses a non-local database with --seed and an empty SEED_PASSWORD", () => {
    expect(
      decideSeed({
        seedFlag: true,
        databaseUrl: REMOTE_URL,
        seedPassword: "",
      }).action,
    ).toBe("refuse");
  });

  it("seeds a non-local database with --seed and SEED_PASSWORD", () => {
    expect(
      decideSeed({
        seedFlag: true,
        databaseUrl: REMOTE_URL,
        seedPassword: "strong-password",
      }).action,
    ).toBe("seed");
  });

  it("skips when DATABASE_URL is unset and --seed is not passed", () => {
    expect(
      decideSeed({
        seedFlag: false,
        databaseUrl: undefined,
        seedPassword: undefined,
      }).action,
    ).toBe("skip");
  });
});
