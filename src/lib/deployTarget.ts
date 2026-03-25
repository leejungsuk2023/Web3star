/** `vite build` (기본 production) = 웹 소개·가입. `vite build --mode app` = 모바일 앱 번들. */
export const isWebMarketingBuild = import.meta.env.VITE_DEPLOY_TARGET === 'web';

/** 로그인/가입 직후 이동 경로 */
export function getPostAuthPath(): string {
  return isWebMarketingBuild ? '/?app=1' : '/app';
}
