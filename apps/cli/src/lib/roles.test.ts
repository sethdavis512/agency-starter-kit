import { describe, expect, it } from "vitest";
import { isValidRole, USER_ROLES } from "./roles";

describe("isValidRole", () => {
  it.each(USER_ROLES)("accepts %s", (role) => {
    expect(isValidRole(role)).toBe(true);
  });

  it("rejects a mistyped role", () => {
    expect(isValidRole("Admin")).toBe(false);
  });

  it("rejects an arbitrary string", () => {
    expect(isValidRole("superuser")).toBe(false);
  });
});
