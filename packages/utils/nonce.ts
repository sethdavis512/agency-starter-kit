import { createContext, useContext } from "react";

/**
 * Carries the per-request CSP nonce from `entry.server.tsx` (which generates
 * it and puts it in the `Content-Security-Policy` header) down to `root.tsx`,
 * where `<Scripts nonce>` and `<ScrollRestoration nonce>` stamp it onto the
 * inline scripts React Router renders.
 *
 * Only the server provides a value. In the browser there is no provider, so
 * `useNonce()` returns `undefined`; that is fine because the nonce only
 * matters for the server-rendered document — hydration never re-inserts
 * those scripts.
 */
export const NonceContext = createContext<string | undefined>(undefined);

export function useNonce(): string | undefined {
  return useContext(NonceContext);
}
