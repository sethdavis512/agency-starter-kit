import { expect, type Page } from '@playwright/test'

export const SEEDED_USER = {
  email: 'seth@mail.com',
  password: 'asdfasdf',
} as const

export async function signIn(
  page: Page,
  credentials: { email: string; password: string } = SEEDED_USER,
) {
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()

  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function signOut(page: Page) {
  await page.getByRole('link', { name: 'Sign Out' }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}
