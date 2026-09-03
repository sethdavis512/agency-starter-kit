import { expect, test } from "@playwright/test";
import { signIn, signOut } from "../helpers/auth";

// Seeded by packages/database/prisma/seed.ts with role "user".
const SEEDED_NON_ADMIN = {
  email: "ethan.brown@example.com",
  password: "asdfasdf",
} as const;

test.describe("admin auth smoke", () => {
  test("redirects unauthenticated access to sign-in", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("supports seeded admin auth flow across protected routes", async ({
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
    await expect(page.getByText(/^admin$/i)).toBeVisible();

    await signOut(page);
  });

  test("shows the 403 page to a signed-in non-admin user", async ({ page }) => {
    await signIn(page, SEEDED_NON_ADMIN);

    await expect(
      page.getByRole("heading", { name: "You need an admin account" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(
      0,
    );

    const profileResponse = await page.goto("/profile");
    expect(profileResponse?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { name: "You need an admin account" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "My Profile" })).toHaveCount(
      0,
    );

    await signOut(page);
  });

  test("does not expose a sign-up route", async ({ page }) => {
    const response = await page.goto("/sign-up");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveCount(0);
  });
});
