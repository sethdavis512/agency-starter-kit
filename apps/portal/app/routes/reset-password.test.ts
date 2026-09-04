import { describe, it, expect } from "vitest";
import { loader } from "./reset-password";
import { userContext } from "@repo/auth/context";

function createContext(user: unknown) {
  return {
    get: (key: unknown) => (key === userContext ? user : undefined),
    set: () => {},
  };
}

describe("reset-password loader", () => {
  it("returns the token from the query string", async () => {
    const request = new Request("http://localhost/reset-password?token=abc123");
    const result = await loader({
      request,
      params: {},
      context: createContext(null),
    } as any);

    expect(result).toEqual({ token: "abc123", error: null });
  });

  it("returns the error from an invalid-token redirect", async () => {
    const request = new Request(
      "http://localhost/reset-password?error=INVALID_TOKEN",
    );
    const result = await loader({
      request,
      params: {},
      context: createContext(null),
    } as any);

    expect(result).toEqual({ token: null, error: "INVALID_TOKEN" });
  });

  it("redirects to /dashboard when a user is in context", async () => {
    const request = new Request("http://localhost/reset-password?token=abc");
    const context = createContext({
      id: "1",
      email: "test@test.com",
      name: "Test",
      role: "user",
    });

    try {
      await loader({ request, params: {}, context } as any);
      expect.unreachable("should have thrown a redirect");
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/dashboard");
    }
  });
});
