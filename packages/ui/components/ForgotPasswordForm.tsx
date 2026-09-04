import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { FieldRoot, FieldLabel } from "./Field";
import { AppLink } from "./AppLink";

interface ForgotPasswordFormProps {
  /**
   * App route the emailed link lands on. Better Auth redirects there with
   * `?token=` (valid) or `?error=INVALID_TOKEN` (expired/unknown).
   */
  redirectTo?: string;
  onError?: (error: string) => void;
}

export function ForgotPasswordForm({
  redirectTo = "/reset-password",
  onError,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.requestPasswordReset(
        { email, redirectTo },
        {
          onSuccess: () => {
            setSent(true);
          },
          onError: (ctx) => {
            const errorMsg = ctx.error.message || "Could not send a reset link";
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

  return (
    <div className="flex-1 flex items-center justify-center my-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-neutral">
            Forgot Password
          </h2>
        </div>
        {sent ? (
          <div className="mt-8 space-y-6">
            <p className="text-center text-sm text-neutral">
              If an account exists for <strong>{email}</strong>, a password
              reset link is on its way. Check your inbox.
            </p>
            <div className="text-center text-sm">
              <AppLink to="/sign-in" variant="dark">
                Back to sign in
              </AppLink>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-danger text-sm text-center">{error}</div>
            )}
            <div className="space-y-4">
              <p className="text-sm text-neutral/60">
                Enter the email for your account and we'll send you a link to
                reset your password.
              </p>
              <FieldRoot>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FieldRoot>
            </div>
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="md"
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </div>
            <div className="text-center text-sm">
              <AppLink to="/sign-in" variant="dark">
                Back to sign in
              </AppLink>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
