import { expect, test } from "@playwright/test";
import { signIn, signOut, uniqueEmail } from "../helpers/auth";
import { waitForEmail } from "../helpers/email";

test.describe("portal auth smoke", () => {
  test("redirects unauthenticated access to sign-in", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("supports seeded user auth flow across protected routes", async ({
    page,
  }) => {
    await signIn(page);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("heading", { name: "My Profile" }),
    ).toBeVisible();

    await signOut(page);
  });

  test("supports sign-up for a new user", async ({ page }) => {
    const email = uniqueEmail("portal-e2e");

    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("Portal E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("asdfasdf");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await signOut(page);
  });

  test("resets a password via the emailed link", async ({ page }) => {
    const email = uniqueEmail("portal-reset");
    const newPassword = "reset-e2e-pass";

    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("Portal Reset User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("asdfasdf");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await signOut(page);

    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Check your inbox.")).toBeVisible();

    // No RESEND_API_KEY in e2e, so the console transport mirrors the message
    // (and its link) to the outbox file instead of sending it.
    const message = await waitForEmail(email, "password-reset");
    await page.goto(message.url);
    await expect(page).toHaveURL(/\/reset-password\?token=/);

    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(
      page.getByText("Your password has been updated."),
    ).toBeVisible();
    await page.getByRole("link", { name: "Continue to sign in" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await signIn(page, { email, password: newPassword });
    await signOut(page);
  });

  test("rejects an invalid or expired reset link", async ({ page }) => {
    await page.goto(
      "/api/auth/reset-password/not-a-real-token?callbackURL=/reset-password",
    );

    await expect(page).toHaveURL(/\/reset-password\?error=INVALID_TOKEN$/);
    await expect(
      page.getByText("This password reset link is invalid or has expired."),
    ).toBeVisible();

    await page.getByRole("link", { name: "Request a new link" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
