import { isRouteErrorResponse, useRouteError } from 'react-router';
import { clearChunkReloadSessionFlag } from '../../lib/installChunkLoadRecovery';
import { Button } from './ui/button';

export function isChunkLoadError(error: unknown): boolean {
  return /dynamically import|dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|ChunkLoadError/i.test(
    errorToText(error),
  );
}

function errorToText(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    const data = typeof error.data === 'string' ? error.data : '';
    return `${error.status} ${error.statusText} ${data}`;
  }
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : '';
    return `${error.name} ${error.message} ${cause}`;
  }
  return String(error);
}

export default function ChunkLoadErrorFallback() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);

  const hardReload = async () => {
    clearChunkReloadSessionFlag();
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    const u = new URL(window.location.href);
    ['_r', '_chunk', 'chunk_reload'].forEach((k) => u.searchParams.delete(k));
    u.searchParams.set('_r', String(Date.now()));
    window.location.replace(u.toString());
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-6 py-12">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-lg font-semibold">
          {chunk ? '업데이트 후 페이지를 불러오지 못했습니다' : '문제가 발생했습니다'}
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {chunk
            ? '배포가 바뀌었는데 브라우저·CDN에 예전 index.html이 남아 있을 때 자주 발생합니다. 아래 버튼은 캐시 저장소를 비우고 한 번 더 불러옵니다. 그래도 같으면 Chrome 기준: 설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제에서 web3star.org만 쿠키·캐시 삭제 후 다시 접속해 보세요.'
            : '페이지를 다시 불러오거나 잠시 후 다시 시도해 주세요.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button type="button" onClick={hardReload} className="w-full sm:w-auto">
            전체 새로고침
          </Button>
        </div>
        {import.meta.env.DEV && (
          <pre className="text-left text-xs text-zinc-500 mt-4 overflow-auto max-h-40 rounded-md bg-zinc-900/80 p-3">
            {errorToText(error)}
          </pre>
        )}
      </div>
    </div>
  );
}
