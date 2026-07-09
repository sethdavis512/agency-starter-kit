import { redirect } from "react-router";
import { auth } from "./auth.server";
import { userContext, type AuthUser } from "./context";

interface AuthMiddlewareArgs {
  request: Request;
  context: {
    get(context: typeof userContext): AuthUser | null;
    set(context: typeof userContext, value: AuthUser | null): void;
  };
}

/**
 * Middleware to fetch the session once and populate userContext for the
 * whole matched route branch. Put this on the outermost layout (e.g.
 * site-layout) so descendant loaders/middleware read the user via
 * `context.get(userContext)` instead of each calling
 * `auth.api.getSession` themselves.
 */
export async function populateSession({
  request,
  context,
}: AuthMiddlewareArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  context.set(
    userContext,
    session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role ?? "user",
        }
      : null,
  );
}

/**
 * Middleware to check if user is authenticated.
 * Relies on `populateSession` having already run earlier in the chain
 * (e.g. on the site layout) — it does not fetch the session itself.
 * If not authenticated, redirects to /sign-in.
 */
export async function requireAuth({
  context,
}: Pick<AuthMiddlewareArgs, "context">) {
  const user = context.get(userContext);

  if (!user) {
    throw redirect("/sign-in");
  }
}

/**
 * Middleware to check if user has admin role.
 * Must be used after requireAuth middleware.
 * Throws 403 if user is not an admin.
 */
export async function requireAdmin({
  context,
}: Pick<AuthMiddlewareArgs, "context">) {
  const user = context.get(userContext);

  if (!user || user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
}
