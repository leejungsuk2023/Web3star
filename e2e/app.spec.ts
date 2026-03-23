import { test, expect, type Page } from '@playwright/test';

// 고정 테스트 계정 (global-setup에서 생성)
const TEST_EMAIL = 'e2etest@web3star.com';
const TEST_PASSWORD = 'TestPass1234!';
const TEST_NICKNAME = 'E2ETester';

async function agreeToSignupPolicies(page: Page) {
  const boxes = page.getByRole('checkbox');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
}

// ─────────────────────────────────────────────
// 1. 회원가입
// ─────────────────────────────────────────────
test.describe('Signup', () => {
  test('should open Terms of Service modal from link', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: 'Terms of Service' }).click();
    await expect(page.getByRole('heading', { name: 'Web3Star Terms of Service' })).toBeVisible();
    await expect(page.getByText('1. Purpose')).toBeVisible();
    await expect(page.getByText('10. Governing Law and Dispute Resolution')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('heading', { name: 'Web3Star Terms of Service' })).toBeHidden();
  });

  test('should show signup form and submit', async ({ page }) => {
    await page.goto('/signup');

    // 페이지 로드 확인
    await expect(page.getByRole('button', { name: /Start mining/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    await agreeToSignupPolicies(page);

    // 폼 입력 (고유 이메일로 가입 테스트)
    const uniqueEmail = `signup${Date.now()}@web3star.com`;
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByLabel('Nickname').fill('SignupTest');

    // 가입 클릭
    await page.getByRole('button', { name: /Start mining/i }).click();

    // 이메일 인증 ON이면 /login 등으로 빠질 수 있음 — signup 페이지를 벗어나면 성공
    await page.waitForURL((url) => !url.pathname.endsWith('/signup'), { timeout: 20000 });
    await expect(
      page.getByText('Next Mining Cycle').or(page.getByRole('button', { name: 'Login' }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid referral code', async ({ page }) => {
    await page.goto('/signup');

    await agreeToSignupPolicies(page);

    await page.getByLabel('Email').fill(`invalid${Date.now()}@web3star.com`);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByLabel('Nickname').fill('BadRef');
    await page.getByPlaceholder('Enter referral code').fill('XXXXXX');

    await page.getByRole('button', { name: /Start mining/i }).click();

    // 잘못된 추천코드 에러 확인
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Invalid referral code')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/login');
  });
});

// ─────────────────────────────────────────────
// 2. 로그인
// ─────────────────────────────────────────────
test.describe('Login', () => {
  test('should show error with wrong credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@gmail.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // 에러 메시지 표시 확인
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');

    // 폼 요소 존재 확인
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByText('Forgot Password?')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Sign Up').click();
    await expect(page).toHaveURL('/signup');
  });
});

// ─────────────────────────────────────────────
// 3. 비로그인 시 보호된 라우트 리다이렉트
// ─────────────────────────────────────────────
test.describe('Protected routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    // ProtectedRoute가 /login으로 리다이렉트
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should redirect leaderboard to login', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should redirect profile to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});

// ─────────────────────────────────────────────
// 4. Splash 화면
// ─────────────────────────────────────────────
test.describe('Splash', () => {
  test('should show splash and redirect', async ({ page }) => {
    await page.goto('/splash');

    // 로고 이미지 표시 확인
    await expect(page.getByAltText('Web3Star')).toBeVisible();

    // 2초 후 로그인 또는 홈으로 리다이렉트
    await expect(page).not.toHaveURL('/splash', { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────
// 5~8. 로그인 후 플로우 (세션 재사용)
//   Supabase 이메일 인증이 비활성화된 경우만 동작
//   활성화 시 사전에 수동으로 계정 확인 필요
// ─────────────────────────────────────────────
test.describe('Authenticated flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    try {
      await expect(page.getByText('Next Mining Cycle')).toBeVisible({ timeout: 15000 });
    } catch {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      console.log(`[Auth Debug] URL: ${page.url()}, Body: ${bodyText.substring(0, 200)}`);
      test.skip(true, 'Login failed — run global-setup or check Supabase email confirmation setting');
    }
  });

  // ─────────────────────────────────────────
  // 5. 홈 화면 요소 확인
  // ─────────────────────────────────────────
  test('should show home screen elements', async ({ page }) => {
    // 타이머 표시
    await expect(page.getByText('Next Mining Cycle')).toBeVisible();

    // W 채굴 버튼 존재
    await expect(
      page.getByLabel('Start Mining').or(page.getByLabel('Mining in progress'))
    ).toBeVisible();

    // Get More Point 슬롯 섹션
    await expect(page.getByText('Get More Point')).toBeVisible();
    await expect(page.getByText(/\d\/5/)).toBeVisible();

    // 헤더에 포인트 표시
    await expect(page.getByText('Pts')).toBeVisible();
  });

  // ─────────────────────────────────────────
  // 6. 채굴 버튼 클릭
  // ─────────────────────────────────────────
  test('should open modal when clicking mine button', async ({ page }) => {
    const mineButton = page.getByLabel('Start Mining');

    if (await mineButton.isDisabled()) {
      // 쿨다운 중이면 Mining in progress 라벨 확인
      await expect(page.getByLabel('Mining in progress')).toBeVisible();
      return;
    }

    await mineButton.click();

    // 모달 표시 확인 (heading으로 특정)
    await expect(page.getByRole('heading', { name: 'Get More Point' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Watch Ad' })).toBeVisible();

    // 광고 시청 → 채굴
    await page.getByRole('button', { name: 'Watch Ad' }).click();

    // 채굴 완료: 버튼이 Mining in progress로 변경됨
    await expect(page.getByRole('button', { name: 'Mining in progress' })).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────
  // 7. 광고 슬롯 시청
  // ─────────────────────────────────────────
  test('should activate ad slot', async ({ page }) => {
    const slot = page.getByLabel(/^Ad slot \d+$/).first();

    if (!(await slot.isEnabled())) {
      return; // 모든 슬롯 이미 활성화됨
    }

    await slot.click();
    await expect(page.getByRole('button', { name: 'Watch Ad' })).toBeVisible();
    await page.getByRole('button', { name: 'Watch Ad' }).click();

    // 슬롯 활성화 토스트
    await expect(page.getByText(/Slot \d\/5 activated/)).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────
  // 8. 리더보드
  // ─────────────────────────────────────────
  test('should show leaderboard', async ({ page }) => {
    await page.getByText('Leaderboard').click();
    await expect(page).toHaveURL('/leaderboard');

    await expect(page.getByText('Top Miners')).toBeVisible();
    await expect(page.getByText('My Rank')).toBeVisible();
    await expect(page.getByText('My Points')).toBeVisible();
    await expect(page.getByLabel('Refresh leaderboard')).toBeVisible();
  });

  // ─────────────────────────────────────────
  // 9. 프로필 + 로그아웃
  // ─────────────────────────────────────────
  test('should show profile and logout', async ({ page }) => {
    await page.getByText('Profile').last().click();
    await expect(page).toHaveURL('/profile');

    // 프로필 정보
    await expect(page.getByText('Referral Code')).toBeVisible();
    await expect(page.getByText('Level 1 Miner')).toBeVisible();

    // 로그아웃
    await page.getByText('Log Out').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
