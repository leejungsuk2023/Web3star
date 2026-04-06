/**
 * Google 전용 로그인 UI 이후 비밀번호로 E2E 로그인을 쓰지 않습니다.
 * 인증이 필요한 스위트는 스킵되며, 필요 시 storageState·서비스 롤 등으로 별도 구성하세요.
 */
export default async function globalSetup() {
  console.log('[Global Setup] Skipped (Google-only auth UI; no password E2E bootstrap).');
}
