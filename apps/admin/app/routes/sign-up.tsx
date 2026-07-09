import { SignUpForm } from "@repo/ui/sign-up-form";
import { redirect, useNavigate } from "react-router";
import type { Route } from "./+types/sign-up";
import { userContext } from "@repo/auth/context";

export async function loader({ context }: Route.LoaderArgs) {
  if (context.get(userContext)) {
    throw redirect("/dashboard");
  }
  return null;
}

export default function SignUp() {
  const navigate = useNavigate();

  return <SignUpForm onSuccess={() => navigate("/dashboard")} />;
}
