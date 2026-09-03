import { Outlet } from "react-router";
import type { Route } from "./+types/protected-layout";
import { requireAdmin, requireAuth } from "@repo/auth/middleware";

// requireAuth redirects anonymous visitors to /sign-in; requireAdmin then
// rejects signed-in non-admin accounts with a 403 (rendered by root.tsx).
export const middleware: Route.MiddlewareFunction[] = [
  requireAuth,
  requireAdmin,
];

export async function loader() {
  return null;
}

export default function ProtectedLayout() {
  return <Outlet />;
}
