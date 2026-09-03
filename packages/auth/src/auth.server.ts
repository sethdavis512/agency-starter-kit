import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/database";
import {
  createEmailTransport,
  emailVerificationEmail,
  passwordResetEmail,
} from "./email.server";

const trustedOriginsFromEnv =
  process.env.TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

if (!process.env.BETTER_AUTH_URL) {
  throw new Error(
    "BETTER_AUTH_URL is required — @repo/auth is shared by both portal and admin, so it " +
      "cannot default to either app's port. Set it in the app's .env (see .env.example).",
  );
}

// Off by default so the template works with no email provider configured. With
// `REQUIRE_EMAIL_VERIFICATION=1`, sign-up emails a verification link instead of
// starting a session, and sign-in is refused (and the link re-sent) until the
// address is verified.
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "1";

// Resolved at boot so a misconfigured provider (RESEND_API_KEY without
// EMAIL_FROM) fails fast instead of at the first password reset.
const email = createEmailTransport(process.env);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:5510",
    "http://localhost:5520",
    ...trustedOriginsFromEnv,
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    // `url` is Better Auth's `/api/auth/reset-password/<token>?callbackURL=...`
    // endpoint, which redirects to the app's `/reset-password` route with
    // `?token=` (valid) or `?error=INVALID_TOKEN` (expired/unknown).
    sendResetPassword: async ({ user, url }) => {
      await email.send(passwordResetEmail({ to: user.email, url }));
    },
  },
  emailVerification: {
    // Sent on sign-up only when verification is required (Better Auth's
    // `sendOnSignUp` defaults to `requireEmailVerification`), and re-sent on
    // any sign-in attempt from an unverified account (`sendOnSignIn`, which
    // is a no-op while verification is off because sign-in never rejects).
    sendVerificationEmail: async ({ user, url }) => {
      await email.send(emailVerificationEmail({ to: user.email, url }));
    },
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
});
