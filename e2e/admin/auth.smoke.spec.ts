import { expect, test } from '@playwright/test'
import { signIn, signOut, uniqueEmail } from '../helpers/auth'

test.describe('admin auth smoke', () => {
  test('redirects unauthenticated access to sign-in', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/sign-in$/)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  })

  test('supports seeded user auth flow across protected routes', async ({
    page,
  }) => {
    await signIn(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.getByRole('link', { name: 'Profile' }).click()
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible()
    await expect(page.getByText(/^admin$/i)).toBeVisible()

    await signOut(page)
  })

  test('supports sign-up for a new user', async ({ page }) => {
    const email = uniqueEmail('admin-e2e')

    await page.goto('/sign-up')
    await page.getByLabel('Name').fill('Admin E2E User')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('asdfasdf')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await signOut(page)
  })
})
