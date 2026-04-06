/**
 * Vite `import.meta.env.BASE_URL`는 보통 `/Web3star/` 처럼 끝에 `/`가 붙습니다.
 * React Router `createBrowserRouter({ basename })`는 문서상 슬래시 없이 `/Web3star` 형태를 기대합니다.
 * basename 불일치 시 GitHub Pages 등 서브패스 배포에서 화면이 비는 증상이 납니다.
 */
export function viteRouterBasename(): string {
  const raw = import.meta.env.BASE_URL || '/';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}
