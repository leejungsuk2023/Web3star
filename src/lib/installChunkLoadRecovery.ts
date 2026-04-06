/**
 * 배포 후 예전 index.html이 남아 해시된 청크 URL이 404/실패할 때,
 * React Router errorElement에 닿기 전에 unhandledrejection·script error로 끝나는 경우가 있어
 * 전역에서 한 번만 강제로 문서를 다시 받도록 시도합니다.
 */
export const CHUNK_RELOAD_SESSION_KEY = 'web3star_chunk_reload_once';

export function clearChunkReloadSessionFlag(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function isChunkLoadFailure(reason: unknown): boolean {
  const text =
    reason instanceof Error
      ? `${reason.message} ${reason.cause instanceof Error ? reason.cause.message : ''}`
      : String(reason);
  return /dynamically import|dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|ChunkLoadError/i.test(
    text,
  );
}

function hardNavigateFreshDocument(): void {
  const url = new URL(window.location.href);
  ['_r', '_chunk', 'chunk_reload'].forEach((k) => url.searchParams.delete(k));
  url.searchParams.set('chunk_reload', String(Date.now()));
  window.location.replace(url.pathname + url.search + url.hash);
}

export function installChunkLoadRecovery(): void {
  if (import.meta.env.DEV || typeof window === 'undefined') return;
  if (import.meta.env.VITE_DEPLOY_TARGET !== 'web') return;

  const tryOnce = (source: string) => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === '1') {
        console.warn('[Web3Star] Chunk load recovery already tried:', source);
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
    } catch {
      hardNavigateFreshDocument();
      return;
    }
    hardNavigateFreshDocument();
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (!isChunkLoadFailure(event.reason)) return;
      event.preventDefault();
      tryOnce('unhandledrejection');
    },
    true,
  );

  window.addEventListener(
    'error',
    (event) => {
      const t = event.target;
      if (!(t instanceof HTMLScriptElement)) return;
      const src = t.src;
      if (!src || !/\/assets\/[^/]+\.js(\?|$)/.test(src)) return;
      event.preventDefault();
      tryOnce('script-error');
    },
    true,
  );
}
