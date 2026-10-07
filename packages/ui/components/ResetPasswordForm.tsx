import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { FieldRoot, FieldLabel } from "./Field";
import { AppLink } from "./AppLink";

interface ResetPasswordFormProps {
  /** `?token=` from the reset link; `null` when missing. */
  token: string | null;
  /** `?error=` from the reset link, e.g. `INVALID_TOKEN`. */
  error?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ResetPasswordForm({
  token,
  error: linkError,
  onSuccess,
  onError,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const linkIsInvalid = !token || Boolean(linkError);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authClient.resetPassword(
        { newPassword: password, token: token ?? "" },
        {
          onSuccess: () => {
            setDone(true);
            onSuccess?.();
          },
          onError: (ctx) => {
            const errorMsg = ctx.error.message || "Password reset failed";
            setError(errorMsg);
            onError?.(errorMsg);
          },
        },
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  let content: React.ReactNode;

  if (linkIsInvalid) {
    content = (
      <div className="mt-8 space-y-6">
        <p className="text-center text-sm text-neutral">
          This password reset link is invalid or has expired.
        </p>
        <div className="text-center text-sm">
          <AppLink to="/forgot-password" variant="dark">
            Request a new link
          </AppLink>
        </div>
      </div>
    );
  } else if (done) {
    content = (
      <div className="mt-8 space-y-6">
        <p className="text-center text-sm text-neutral">
          Your password has been updated.
        </p>
        <div className="text-center text-sm">
          <AppLink to="/sign-in" variant="dark">
            Continue to sign in
          </AppLink>
        </div>
      </div>
    );
  } else {
    content = (
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="text-danger text-sm text-center">{error}</div>
        )}
        <div className="space-y-4">
          <FieldRoot>
            <FieldLabel>New password</FieldLabel>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldRoot>
          <FieldRoot>
            <FieldLabel>Confirm new password</FieldLabel>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FieldRoot>
        </div>
        <div>
          <Button type="submit" disabled={loading} className="w-full" size="md">
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center my-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-neutral">
            Reset Password
          </h2>
        </div>
        {content}
      </Card>
    </div>
  );
}
