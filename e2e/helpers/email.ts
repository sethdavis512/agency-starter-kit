import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Where the dev servers' console email transport (`@repo/auth`, used whenever
 * `RESEND_API_KEY` is unset) mirrors each message as one JSON line. The
 * Playwright config passes this path to both apps via `EMAIL_OUTBOX_FILE` so
 * specs can read the emailed link back instead of scraping server stdout.
 */
export const EMAIL_OUTBOX_FILE = path.join(
  os.tmpdir(),
  "agency-starter-kit-e2e-email-outbox.jsonl",
);

export interface OutboxEmail {
  kind: "password-reset" | "email-verification";
  to: string;
  subject: string;
  url: string;
  sentAt: string;
}

async function readOutbox(): Promise<OutboxEmail[]> {
  let raw: string;
  try {
    raw = await readFile(EMAIL_OUTBOX_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OutboxEmail);
}

/** Polls the outbox for the most recent message of `kind` sent to `to`. */
export async function waitForEmail(
  to: string,
  kind: OutboxEmail["kind"],
  { timeoutMs = 15_000, intervalMs = 250 } = {},
): Promise<OutboxEmail> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const match = (await readOutbox())
      .reverse()
      .find((email) => email.to === to && email.kind === kind);
    if (match) {
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `No "${kind}" email for ${to} appeared in ${EMAIL_OUTBOX_FILE} within ${timeoutMs}ms`,
  );
}
