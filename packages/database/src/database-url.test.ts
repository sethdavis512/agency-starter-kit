import { describe, expect, it } from "vitest";
import { isLocalDatabase } from "./database-url";

describe("isLocalDatabase", () => {
  it.each([
    "postgresql://postgres:postgres@localhost:5432/agency_starter",
    "postgresql://postgres:postgres@localhost:5432/agency_starter?schema=public",
    "postgresql://postgres:postgres@127.0.0.1:5432/agency_starter",
  ])("accepts %s", (url) => {
    expect(isLocalDatabase(url)).toBe(true);
  });

  it.each([
    "postgresql://user:pass@containers-us-west-1.railway.app:5432/railway",
    "postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/neondb",
    "postgresql://user:pass@localhost.example.com:5432/db",
  ])("rejects %s", (url) => {
    expect(isLocalDatabase(url)).toBe(false);
  });

  it("treats an unset URL as non-local", () => {
    expect(isLocalDatabase(undefined)).toBe(false);
    expect(isLocalDatabase("")).toBe(false);
  });

  it("treats an unparseable URL as non-local", () => {
    expect(isLocalDatabase("not a url")).toBe(false);
  });
});
