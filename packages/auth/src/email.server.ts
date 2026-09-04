import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Resend } from "resend";

/**
 * Outbound email for the auth flows (password reset, email verification).
 *
 * Transport selection is driven by the environment:
 *   - `RESEND_API_KEY` set   → send through Resend from `EMAIL_FROM` (required).
 *   - `RESEND_API_KEY` unset → "console" transport: print the message and its
 *     action link to stdout so the flow works locally with no provider. When
 *     `EMAIL_OUTBOX_FILE` is also set, each message is appended to that file as
 *     one JSON line (used by the e2e suite to read the link back).
 *
 * This module deliberately has no Prisma or Better Auth imports so it can be
 * unit-tested without a generated client.
 */

export type EmailKind = "password-reset" | "email-verification";

export interface EmailMessage {
  kind: EmailKind;
  to: string;
  subject: string;
  text: string;
  html: string;
  /** The single action link in the message, surfaced for logging and tests. */
  url: string;
}

export interface EmailTransport {
  readonly kind: "resend" | "console";
  send(message: EmailMessage): Promise<void>;
}

export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_OUTBOX_FILE?: string;
  // Lets `process.env` (and any other string map) be passed in directly.
  [key: string]: string | undefined;
}

function trimmed(value: string | undefined) {
  const result = value?.trim();
  return result ? result : undefined;
}

export function createEmailTransport(
  env: EmailEnv = process.env,
): EmailTransport {
  const apiKey = trimmed(env.RESEND_API_KEY);

  if (!apiKey) {
    return createConsoleTransport(trimmed(env.EMAIL_OUTBOX_FILE));
  }

  const from = trimmed(env.EMAIL_FROM);
  if (!from) {
    throw new Error(
      "EMAIL_FROM is required when RESEND_API_KEY is set — it is the sender address " +
        "for password reset and verification emails (see .env.example).",
    );
  }

  return createResendTransport(apiKey, from);
}

function createResendTransport(apiKey: string, from: string): EmailTransport {
  const resend = new Resend(apiKey);

  return {
    kind: "resend",
    async send(message) {
      const { error } = await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      if (error) {
        throw new Error(
          `Resend failed to send ${message.kind} email: ${error.message}`,
        );
      }
    },
  };
}

function createConsoleTransport(outboxFile?: string): EmailTransport {
  return {
    kind: "console",
    async send(message) {
      console.log(
        [
          `[email] ${message.kind} → ${message.to} (console transport; set RESEND_API_KEY to send real mail)`,
          `  subject: ${message.subject}`,
          `  link:    ${message.url}`,
        ].join("\n"),
      );

      if (outboxFile) {
        mkdirSync(dirname(outboxFile), { recursive: true });
        appendFileSync(
          outboxFile,
          JSON.stringify({ ...message, sentAt: new Date().toISOString() }) +
            "\n",
        );
      }
    },
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildMessage(input: {
  kind: EmailKind;
  to: string;
  subject: string;
  heading: string;
  body: string;
  cta: string;
  url: string;
}): EmailMessage {
  const { kind, to, subject, heading, body, cta, url } = input;
  const safeUrl = escapeHtml(url);

  return {
    kind,
    to,
    subject,
    url,
    text: `${heading}\n\n${body}\n\n${cta}: ${url}\n\nIf you didn't request this, you can ignore this email.`,
    html: [
      `<p><strong>${escapeHtml(heading)}</strong></p>`,
      `<p>${escapeHtml(body)}</p>`,
      `<p><a href="${safeUrl}">${escapeHtml(cta)}</a></p>`,
      `<p>If you didn't request this, you can ignore this email.</p>`,
    ].join("\n"),
  };
}

export function passwordResetEmail(input: { to: string; url: string }) {
  return buildMessage({
    kind: "password-reset",
    to: input.to,
    subject: "Reset your password",
    heading: "Reset your password",
    body: "We received a request to reset the password for this account. The link below expires in one hour.",
    cta: "Reset password",
    url: input.url,
  });
}

export function emailVerificationEmail(input: { to: string; url: string }) {
  return buildMessage({
    kind: "email-verification",
    to: input.to,
    subject: "Verify your email address",
    heading: "Verify your email address",
    body: "Confirm this email address to finish setting up your account.",
    cta: "Verify email",
    url: input.url,
  });
}
