import { describe, it, expect } from "vitest";
import { loader } from "./sign-in";
import { userContext } from "@repo/auth/context";

function createContext(user: unknown) {
  return {
    get: (key: unknown) => (key === userContext ? user : undefined),
    set: () => {},
  };
}

describe("sign-in loader", () => {
  it("returns null when no user in context", async () => {
    const request = new Request("http://localhost:5520/sign-in");
    const result = await loader({
      request,
      params: {},
      context: createContext(null),
    } as any);

    expect(result).toBeNull();
  });

  it("redirects to /dashboard when a user is in context", async () => {
    const request = new Request("http://localhost:5520/sign-in");
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
