/**
 * Security headers shared by both apps' `entry.server.tsx`.
 *
 * The Content-Security-Policy is a deliberate *starter* policy sized to what
 * the apps actually load today:
 *
 * - `script-src 'self' 'nonce-…'` — React Router's hydration script, its
 *   route-module import and (in dev) the HMR runtime import are all inline
 *   scripts rendered by `<Scripts nonce>`, so every document gets a fresh
 *   per-request nonce instead of `'unsafe-inline'`.
 * - `style-src` allows the Google Fonts stylesheet (`root.tsx` links Inter
 *   from fonts.googleapis.com) plus `'unsafe-inline'`: Vite injects `<style>`
 *   tags in dev and Base UI positions popovers with inline `style` attributes.
 * - `font-src` allows the font files that stylesheet pulls from
 *   fonts.gstatic.com.
 * - `img-src` permits `https:` so `Avatar`/`ProfileCard` can render remote
 *   profile images; tighten it once real image hosts are known.
 * - `dev: true` additionally opens `connect-src` to `ws:`/`wss:` for Vite's
 *   HMR websocket and drops `upgrade-insecure-requests`, which would break
 *   plain-http localhost.
 */

export interface SecurityHeadersOptions {
  /** Per-request CSP nonce; generate one with `createNonce()`. */
  nonce: string;
  /** Relax the policy for the Vite dev server. Defaults to `false`. */
  dev?: boolean;
}

export const GOOGLE_FONTS_STYLE_ORIGIN = "https://fonts.googleapis.com";
export const GOOGLE_FONTS_FILE_ORIGIN = "https://fonts.gstatic.com";

/** 128 bits of randomness, base64-encoded, as the CSP spec recommends. */
export function createNonce(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function buildContentSecurityPolicy({
  nonce,
  dev = false,
}: SecurityHeadersOptions): string {
  if (!nonce) {
    throw new Error("buildContentSecurityPolicy requires a non-empty nonce");
  }

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", `'nonce-${nonce}'`]],
    ["style-src", ["'self'", "'unsafe-inline'", GOOGLE_FONTS_STYLE_ORIGIN]],
    ["font-src", ["'self'", GOOGLE_FONTS_FILE_ORIGIN, "data:"]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    ["connect-src", dev ? ["'self'", "ws:", "wss:"] : ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ];

  const serialized = directives.map(
    ([name, values]) => `${name} ${values.join(" ")}`,
  );

  if (!dev) serialized.push("upgrade-insecure-requests");

  return serialized.join("; ");
}

/**
 * Every header set on document responses, keyed by header name. Kept as a
 * plain object so the values can be asserted in tests and listed in docs.
 */
export function buildSecurityHeaders(
  options: SecurityHeadersOptions,
): Record<string, string> {
  return {
    "Content-Security-Policy": buildContentSecurityPolicy(options),
    // Railway terminates TLS at its edge and forwards plain HTTP, so the app
    // cannot infer the public scheme from the request; always send HSTS.
    // Browsers ignore it over http://localhost.
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Legacy twin of `frame-ancestors 'none'` for browsers without CSP 2.
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

/** Mutates and returns `headers` with every security header applied. */
export function applySecurityHeaders(
  headers: Headers,
  options: SecurityHeadersOptions,
): Headers {
  for (const [name, value] of Object.entries(buildSecurityHeaders(options))) {
    headers.set(name, value);
  }
  return headers;
}
