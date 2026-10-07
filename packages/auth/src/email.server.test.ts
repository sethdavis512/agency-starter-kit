import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sendMock = vi.fn();
const resendConstructor = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
    constructor(apiKey?: string) {
      resendConstructor(apiKey);
    }
  },
}));

import {
  createEmailTransport,
  emailVerificationEmail,
  passwordResetEmail,
} from "./email.server";

const RESET_URL =
  "http://localhost:5520/api/auth/reset-password/tok123?callbackURL=%2Freset-password";

beforeEach(() => {
  vi.clearAllMocks();
  sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
});

describe("createEmailTransport", () => {
  it("uses the console transport when RESEND_API_KEY is unset", () => {
    expect(createEmailTransport({}).kind).toBe("console");
    expect(createEmailTransport({ RESEND_API_KEY: "   " }).kind).toBe(
      "console",
    );
    expect(resendConstructor).not.toHaveBeenCalled();
  });

  it("uses Resend when RESEND_API_KEY and EMAIL_FROM are set", () => {
    const transport = createEmailTransport({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Agency <no-reply@example.com>",
    });

    expect(transport.kind).toBe("resend");
    expect(resendConstructor).toHaveBeenCalledWith("re_test");
  });

  it("throws when RESEND_API_KEY is set without EMAIL_FROM", () => {
    expect(() => createEmailTransport({ RESEND_API_KEY: "re_test" })).toThrow(
      /EMAIL_FROM is required/,
    );
  });
});

describe("console transport", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints the recipient and the action link to stdout", async () => {
    const transport = createEmailTransport({});

    await transport.send(passwordResetEmail({ to: "a@b.com", url: RESET_URL }));

    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = String(logSpy.mock.calls[0][0]);
    expect(output).toContain("password-reset");
    expect(output).toContain("a@b.com");
    expect(output).toContain(RESET_URL);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("appends a JSON line per message when EMAIL_OUTBOX_FILE is set", async () => {
    const dir = await mkdtemp(join(tmpdir(), "auth-email-"));
    const outbox = join(dir, "nested", "outbox.jsonl");

    try {
      const transport = createEmailTransport({ EMAIL_OUTBOX_FILE: outbox });
      await transport.send(
        passwordResetEmail({ to: "a@b.com", url: RESET_URL }),
      );
      await transport.send(
        emailVerificationEmail({ to: "c@d.com", url: "http://x/verify" }),
      );

      const lines = (await readFile(outbox, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toMatchObject({
        kind: "password-reset",
        to: "a@b.com",
        url: RESET_URL,
      });
      expect(JSON.parse(lines[1])).toMatchObject({
        kind: "email-verification",
        to: "c@d.com",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("resend transport", () => {
  it("sends from EMAIL_FROM with subject, text and html", async () => {
    const transport = createEmailTransport({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Agency <no-reply@example.com>",
    });

    await transport.send(passwordResetEmail({ to: "a@b.com", url: RESET_URL }));

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      from: "Agency <no-reply@example.com>",
      to: "a@b.com",
      subject: "Reset your password",
    });
    expect(payload.text).toContain(RESET_URL);
    // The `&` in the query string must be entity-escaped inside the href.
    expect(payload.html).toContain(
      `href="${RESET_URL.replaceAll("&", "&amp;")}"`,
    );
  });

  it("surfaces a Resend error as a thrown Error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Invalid `from` field" },
    });
    const transport = createEmailTransport({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "bad",
    });

    await expect(
      transport.send(
        emailVerificationEmail({ to: "a@b.com", url: "http://x" }),
      ),
    ).rejects.toThrow(/Invalid `from` field/);
  });
});

describe("message builders", () => {
  it("builds distinct subjects and embeds the link in text and html", () => {
    const reset = passwordResetEmail({ to: "a@b.com", url: "http://r" });
    const verify = emailVerificationEmail({ to: "a@b.com", url: "http://v" });

    expect(reset.subject).toBe("Reset your password");
    expect(verify.subject).toBe("Verify your email address");
    expect(reset.text).toContain("http://r");
    expect(verify.html).toContain('href="http://v"');
  });
});
