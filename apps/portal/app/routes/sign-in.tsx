import { SignInForm } from "@repo/ui/sign-in-form";
import { redirect, useNavigate } from "react-router";
import type { Route } from "./+types/sign-in";
import { userContext } from "@repo/auth/context";

export async function loader({ context }: Route.LoaderArgs) {
  if (context.get(userContext)) {
    throw redirect("/dashboard");
  }
  return null;
}

export default function SignIn() {
  const navigate = useNavigate();

  return <SignInForm onSuccess={() => navigate("/dashboard")} />;
}
