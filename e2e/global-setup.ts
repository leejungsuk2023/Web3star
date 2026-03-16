import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imlmvqpbjuznvprwhkkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG12cXBianV6bnZwcndoa2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDM4NjksImV4cCI6MjA4NjU3OTg2OX0.Vy1u_IbKEAy5Zhl7R1z58oGlyvfd7JVHO730bMVH71c';

const TEST_EMAIL = 'e2etest@web3star.com';
const TEST_PASSWORD = 'TestPass1234!';
const TEST_NICKNAME = 'E2ETester';

export default async function globalSetup() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 먼저 로그인 시도 (이미 계정 있으면 성공)
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (!loginError) {
    console.log('[Global Setup] Test account already exists — login OK');
    await supabase.auth.signOut();
    return;
  }

  // 계정이 없으면 가입
  const { error: signupError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: {
      data: { nickname: TEST_NICKNAME },
    },
  });

  if (signupError) {
    console.error('[Global Setup] Signup failed:', signupError.message);
  } else {
    console.log('[Global Setup] Test account created successfully');
  }

  await supabase.auth.signOut();
}
