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
 * Middleware to check if user is authenticated.
 * If not authenticated, redirects to /sign-in.
 * If authenticated, sets user in context for downstream loaders/actions.
 */
export async function requireAuth({ request, context }: AuthMiddlewareArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/sign-in");
  }

  context.set(userContext, {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role ?? "user",
  });
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
