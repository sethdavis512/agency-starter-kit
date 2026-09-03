import { ResetPasswordForm } from "@repo/ui/reset-password-form";
import { redirect } from "react-router";
import type { Route } from "./+types/reset-password";
import { userContext } from "@repo/auth/context";

// Landing page for the emailed reset link. Better Auth's
// `/api/auth/reset-password/<token>` endpoint redirects here with `?token=`
// when the token is valid, or `?error=INVALID_TOKEN` when it is expired or
// unknown; the form renders the matching state.
export async function loader({ request, context }: Route.LoaderArgs) {
  if (context.get(userContext)) {
    throw redirect("/dashboard");
  }

  const url = new URL(request.url);

  return {
    token: url.searchParams.get("token"),
    error: url.searchParams.get("error"),
  };
}

export default function ResetPassword({ loaderData }: Route.ComponentProps) {
  return (
    <ResetPasswordForm token={loaderData.token} error={loaderData.error} />
  );
}
