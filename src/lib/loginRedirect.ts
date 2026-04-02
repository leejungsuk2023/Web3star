import { getPostAuthPath } from './deployTarget';

/**
 * 로그인 성공 후 이동 경로. 오픈 리다이렉트 방지를 위해 `/admin` 하위만 허용.
 */
export function getSafePostLoginPath(nextParam: string | null | undefined): string {
  const fallback = getPostAuthPath();
  if (nextParam == null || typeof nextParam !== 'string') return fallback;
  const t = nextParam.trim();
  if (!t.startsWith('/')) return fallback;
  if (t.startsWith('//') || t.includes('://')) return fallback;
  if (!t.startsWith('/admin')) return fallback;
  return t;
}
