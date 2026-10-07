import { describe, expect, it } from "vitest";
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  createNonce,
} from "./security-headers";

const NONCE = "dGVzdC1ub25jZQ==";

function directives(csp: string): Record<string, string> {
  return Object.fromEntries(
    csp.split(";").map((part) => {
      const [name, ...values] = part.trim().split(" ");
      return [name, values.join(" ")];
    }),
  );
}

describe("createNonce", () => {
  it("returns base64 of 16 random bytes and differs per call", () => {
    const a = createNonce();
    const b = createNonce();

    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(a).not.toBe(b);
  });
});

describe("buildContentSecurityPolicy", () => {
  it("allows self plus the nonce for scripts and never unsafe-inline", () => {
    const csp = directives(buildContentSecurityPolicy({ nonce: NONCE }));

    expect(csp["script-src"]).toBe(`'self' 'nonce-${NONCE}'`);
    expect(csp["script-src"]).not.toContain("unsafe-inline");
  });

  it("allows the Google Fonts stylesheet and font files", () => {
    const csp = directives(buildContentSecurityPolicy({ nonce: NONCE }));

    expect(csp["style-src"]).toContain("https://fonts.googleapis.com");
    expect(csp["font-src"]).toContain("https://fonts.gstatic.com");
  });

  it("locks down framing, plugins, base and form targets", () => {
    const csp = directives(buildContentSecurityPolicy({ nonce: NONCE }));

    expect(csp["default-src"]).toBe("'self'");
    expect(csp["frame-ancestors"]).toBe("'none'");
    expect(csp["object-src"]).toBe("'none'");
    expect(csp["base-uri"]).toBe("'self'");
    expect(csp["form-action"]).toBe("'self'");
  });

  it("upgrades insecure requests in production only", () => {
    expect(buildContentSecurityPolicy({ nonce: NONCE })).toContain(
      "upgrade-insecure-requests",
    );
    expect(
      buildContentSecurityPolicy({ nonce: NONCE, dev: true }),
    ).not.toContain("upgrade-insecure-requests");
  });

  it("opens connect-src to websockets for the Vite dev server only", () => {
    const prod = directives(buildContentSecurityPolicy({ nonce: NONCE }));
    const dev = directives(
      buildContentSecurityPolicy({ nonce: NONCE, dev: true }),
    );

    expect(prod["connect-src"]).toBe("'self'");
    expect(dev["connect-src"]).toBe("'self' ws: wss:");
  });

  it("refuses an empty nonce rather than emitting a broken policy", () => {
    expect(() => buildContentSecurityPolicy({ nonce: "" })).toThrow(/nonce/);
  });
});

describe("buildSecurityHeaders", () => {
  it("sets the full header set with the documented values", () => {
    const headers = buildSecurityHeaders({ nonce: NONCE });

    expect(headers).toMatchObject({
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
    expect(headers["Content-Security-Policy"]).toContain(`'nonce-${NONCE}'`);
    expect(Object.keys(headers)).toHaveLength(6);
  });
});

describe("applySecurityHeaders", () => {
  it("writes every header onto a Headers instance and returns it", () => {
    const headers = new Headers({ "Content-Type": "text/html" });

    const result = applySecurityHeaders(headers, { nonce: NONCE });

    expect(result).toBe(headers);
    expect(headers.get("Content-Type")).toBe("text/html");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Content-Security-Policy")).toBe(
      buildContentSecurityPolicy({ nonce: NONCE }),
    );
  });
});
