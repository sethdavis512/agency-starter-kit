import { ForgotPasswordForm } from "@repo/ui/forgot-password-form";
import { redirect } from "react-router";
import type { Route } from "./+types/forgot-password";
import { userContext } from "@repo/auth/context";

export async function loader({ context }: Route.LoaderArgs) {
  if (context.get(userContext)) {
    throw redirect("/dashboard");
  }
  return null;
}

export default function ForgotPassword() {
  return <ForgotPasswordForm redirectTo="/reset-password" />;
}
