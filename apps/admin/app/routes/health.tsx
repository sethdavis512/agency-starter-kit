import { prisma } from "@repo/database";

// GET /health — resource route (loader only, no component) that Railway's
// `healthcheckPath` probes. It is registered OUTSIDE `site-layout` in
// routes.ts so `populateSession` never runs for it: a probe has no cookie,
// and the check must not depend on the auth layer.
//
// Exception to the "never import the Prisma client directly in routes"
// rule: the whole point of this route is "can this instance reach the
// database", and `@repo/auth/context` only exposes the session user.

const DB_TIMEOUT_MS = 5_000;

const headers = { "Cache-Control": "no-store" };

export async function loader() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("database health check timed out")),
          DB_TIMEOUT_MS,
        );
      }),
    ]);

    return Response.json({ status: "ok" }, { headers });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers });
  } finally {
    clearTimeout(timer);
  }
}
