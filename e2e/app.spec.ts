import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────
// 1. /signup → 로그인 리다이렉트
// ─────────────────────────────────────────────
test.describe('Signup URL (legacy)', () => {
  test('should redirect /signup to login', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/app\/login$/);
  });

  test('should redirect /app/signup to login', async ({ page }) => {
    await page.goto('/app/signup');
    await expect(page).toHaveURL(/\/app\/login$/);
  });
});

// ─────────────────────────────────────────────
// 2. 로그인 (Google 전용 UI)
// ─────────────────────────────────────────────
test.describe('Login', () => {
  test('should show Google-only login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByText(/Sign in or create an account with Google/i)).toBeVisible();
    await expect(page.getByLabel(/Referral code/i)).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(2);
    await expect(page.getByLabel('Email')).toHaveCount(0);
    await expect(page.getByLabel('Password')).toHaveCount(0);
  });

  test('should open Terms of Service from login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Terms of Service' }).click();
    await expect(page.getByRole('heading', { name: 'Web3Star Terms of Service' })).toBeVisible();
    await expect(page.getByText('1. Purpose')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('heading', { name: 'Web3Star Terms of Service' })).toBeHidden();
  });
});

// ─────────────────────────────────────────────
// 3. 비로그인 시 보호된 라우트 리다이렉트
// ─────────────────────────────────────────────
test.describe('Protected routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/app\/login$/, { timeout: 15000 });
  });

  test('should redirect leaderboard to login', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page).toHaveURL(/\/app\/login$/, { timeout: 10000 });
  });

  test('should redirect profile to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/app\/login$/, { timeout: 10000 });
  });
});

// ─────────────────────────────────────────────
// 4. Splash 화면
// ─────────────────────────────────────────────
test.describe('Splash', () => {
  test('should show splash and redirect', async ({ page }) => {
    await page.goto('/splash');

    await expect(page.getByAltText('Web3Star')).toBeVisible();

    await expect(page).not.toHaveURL(/\/app\/splash$/, { timeout: 5000 });
  });
});
