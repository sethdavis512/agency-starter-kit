import { PassThrough } from "node:stream";

import type { EntryContext, HandleErrorFunction } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { logger } from "@repo/utils/logger";
import { NonceContext } from "@repo/utils/nonce";
import {
  applySecurityHeaders,
  createNonce,
} from "@repo/utils/security-headers";

// Identical in portal and admin (scaffold-pair convention). Security headers
// and the CSP live in @repo/utils/security-headers; the logger in
// @repo/utils/logger. See "Security headers and logging" in CLAUDE.md.

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  // One nonce per document: the CSP header carries it and <Scripts nonce>
  // in root.tsx stamps it onto React Router's inline scripts.
  const nonce = createNonce();
  applySecurityHeaders(responseHeaders, { nonce, dev: import.meta.env.DEV });

  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    const { pipe, abort } = renderToPipeableStream(
      <NonceContext value={nonce}>
        <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
      </NonceContext>,
      {
        // React's own inline scripts (Suspense boundary completion) need the
        // nonce too, or the CSP blocks streamed content from swapping in.
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              // Clear the timeout to prevent retaining the closure and memory leak
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleError.
          if (shellRendered) {
            logger.error("Streaming render error", {
              method: request.method,
              url: request.url,
              err: error,
            });
          }
        },
      },
    );
  });
}

/**
 * Request-level error logging. React Router calls this for errors thrown by
 * loaders, actions and rendering. Thrown `Response`s (the 403/404 pages) are
 * expected control flow and are not forwarded here, so every line this
 * writes is a real failure.
 */
export const handleError: HandleErrorFunction = (error, { request }) => {
  // The client went away; nothing to report.
  if (request.signal.aborted) return;

  logger.error("Unhandled request error", {
    method: request.method,
    url: request.url,
    err: error,
  });

  // ── Error reporting hook ────────────────────────────────────────────────
  // No SDK is wired yet. To add Sentry: install `@sentry/react-router` in
  // both apps, initialise it once at module scope from `process.env.SENTRY_DSN`
  // (see .env.example), and forward the error from here:
  //
  //   if (process.env.SENTRY_DSN) {
  //     Sentry.captureException(error, { extra: { url: request.url } });
  //   }
};
