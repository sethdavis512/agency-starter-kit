import { authClient } from "@repo/auth/client";
import { useEffect } from "react";

interface SignOutProps {
  onSuccess?: () => void;
}

export function SignOut({ onSuccess }: SignOutProps) {
  useEffect(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing out...</p>
    </div>
  );
}
